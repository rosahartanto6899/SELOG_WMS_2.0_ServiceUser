import jwt from 'jsonwebtoken';
import * as argon2 from 'argon2';
import { inject, injectable } from 'inversify';
import { HTTP_STATUS } from '@/shared-libs/constants/http-status.constant';
import {
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@/shared-libs/exceptions';
import { AzureAdThird } from '@/integrations/thrid-party/azure-ad.third';
import { default as cache } from '@/shared-libs/utils/cache.util'; // restore: shared Redis session store (cross-service auth)
import { default as SecretManager } from '@/shared-libs/utils/secret-manager.util';
import { TokenEncryption } from '@/shared-libs/utils/token-encryption.util';
import { sequelize } from '@/utils/database.util';
import { Transaction } from 'sequelize';
import logger from '@/shared-libs/utils/logger.util';
import { Request } from 'express';
import { UserAttributes } from '@/database/attributes';
import UAParser from 'ua-parser-js';
import {
  UserRepository,
  LoginHistoryRepository,
  UserLoginActivityRepository,
} from './repositories';
import {
  ILoginHistory,
  ILoginUser,
  IPayloadJwt,
} from './interfaces/login.interface';

@injectable()
export class LoginService {
  constructor(
    @inject(UserRepository) private userRepository: UserRepository,
    @inject(LoginHistoryRepository)
    private readonly loginHistoryRepository: LoginHistoryRepository,
    @inject(UserLoginActivityRepository)
    private readonly userLoginActivityRepository: UserLoginActivityRepository
  ) {}

  /**
   * Handles login with a provider (e.g. Azure AD).
   * @param req Express request object.
   * @returns {Promise<Object>} An object containing the response data and HTTP code.
   */
  public async login(req: any): Promise<any> {
    const t = await sequelize.transaction();
    try {
      const body = req.body;

      const providerHandlers = {
        'azure-ad': async (token: string) => {
          const azureAd = new AzureAdThird();
          const responseAd = await azureAd.me(token);
          return responseAd.data.userPrincipalName;
        },
        default: async () => 'default',
      };

      const email = await providerHandlers['azure-ad'](body.token);

      const user = await this.userRepository.userExistsProvider(email);

      if (!user?.isActive) throw new NotFoundException('User not found');

      const data = await this.generateToken(user);

      await this.storeToRedis(user, data.accessToken, data.user.roleName);

      // Core login operations in transaction
      await this.saveLoginHistory(user, data.user.roleName, t);
      await this.saveUserLoginActivity(req, user, t);
      await t.commit();

      return {
        data: data,
        httpCode: HTTP_STATUS.OK,
      };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Handles local login with email + password (argon2).
   */
  public async loginLocal(req: any): Promise<any> {
    const t = await sequelize.transaction();
    try {
      const { email, password } = req.body;
      const user = await this.userRepository.userExistsProvider(email);

      if (!user?.isActive) throw new NotFoundException('User not found');

      const valid = await argon2.verify(user.password ?? '', password);
      if (!valid) throw new NotFoundException('User not found');

      const data = await this.generateToken(user);

      await this.storeToRedis(user, data.accessToken, data.user.roleName);
      await this.saveLoginHistory(user, data.user.roleName, t);
      await this.saveUserLoginActivity(req, user, t);
      await t.commit();

      return { data, httpCode: HTTP_STATUS.OK };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Handles role switching.
   * @param req Express request object.
   *
   * The request body should contain the roleId to switch to.
   * The user must have the role to switch, otherwise a ForbiddenException is thrown.
   *
   * @returns {Promise<Object>} An object containing the response data and HTTP code.
   */
  async switchRole(req: any): Promise<any> {
    const t = await sequelize.transaction();
    try {
      const userToken = req.user;
      const roleId = req.body.roleId;
      const user = await this.userRepository.userExistsProvider(
        userToken.tokenEmail
      );

      const roleExists = userToken.tokenRoles.some((role) => role.id == roleId);

      if (!roleExists) {
        throw new ForbiddenException('forbidden access');
      }

      const tokenRole = {
        id: roleId,
        name: userToken.tokenRoles.find((role) => role.id == roleId).name,
      };

      const data = await this.generateToken(user, tokenRole);

      await this.storeToRedis(user, data.accessToken, tokenRole.name);

      // Core operations in transaction
      await this.saveLoginHistory(user, tokenRole.name, t);
      await t.commit();

      return {
        data: data,
        httpCode: HTTP_STATUS.OK,
      };
    } catch (error) {
      await t.rollback();
      const errorMessage = (error as Error).message || 'Unknown error';
      throw new InternalServerErrorException(errorMessage as any);
    }
  }

  /**
   * Multi-tenant: switch active customer (tenant).
   * Body: { customerId } — must be one of the user's accessible customers.
   */
  async switchCustomer(req: any): Promise<any> {
    try {
      const userToken = req.user;
      const customerId = req.body.customerId;
      const user = await this.userRepository.userExistsProvider(
        userToken.tokenEmail
      );

      if (!user?.isActive) throw new NotFoundException('User not found');

      const accessible = new Set(
        user.userRoles.flatMap((role: any) =>
          (role.warehouses || [])
            .map((w: any) => w.warehouse?.customerId)
            .filter(Boolean),
        ),
      );

      if (!accessible.has(customerId)) {
        throw new ForbiddenException('forbidden access');
      }

      const data = await this.generateToken(user, null, { id: customerId });

      await this.storeToRedis(
        user,
        data.accessToken,
        data.user.roleName,
        customerId
      );

      return { data, httpCode: HTTP_STATUS.OK };
    } catch (error) {
      if (error instanceof Error) throw error;
      throw new InternalServerErrorException(error as any);
    }
  }

  async saveLoginHistory(
    user: any,
    tokenRole?: string,
    transaction?: Transaction
  ): Promise<void> {
    // Use provided transaction or create a new one if none provided
    const t = transaction || (await sequelize.transaction());
    const shouldCommit = !transaction; // Only commit if we created the transaction

    try {
      const asRole = tokenRole || user.userRoles[0]?.role.name;
      const dataLoginHistory: ILoginHistory = {
        userId: user.id,
        email: user.email,
        asRole: asRole,
        createdBy: user.email,
      };

      await this.loginHistoryRepository.create(dataLoginHistory, t);
      const dataUser: ILoginUser = {
        asRole: asRole,
        updatedBy: user.email,
      };

      await this.userRepository.update(dataUser, { id: user.id }, t);

      if (shouldCommit) {
        await t.commit();
      }
    } catch (error: any) {
      if (shouldCommit) {
        await t.rollback();
      }
      throw error;
    }
  }

  async saveUserLoginActivity(
    req: Request,
    user: UserAttributes,
    transaction?: Transaction
  ): Promise<void> {
    try {
      // Deduplication: Prevent duplicate login activity within 5 seconds
      const dedupeKey = `login-activity:${user.id}`;
      const recentLogin = await cache.get(dedupeKey);

      if (recentLogin) {
        return;
      }
      const dataUserLoginActivity = {
        userId: user.id,
        platform: this.parsePlatform(req.headers['user-agent']),
        ipAddress: this.extractIpAddress(req),
        channel: this.detectChannel(req),
        createdBy: user.id,
        name: user.name,
        email: user.email,
      };

      await this.userLoginActivityRepository.create(
        dataUserLoginActivity,
        transaction
      );

      // Set deduplication flag for 5 seconds
      await cache.set(dedupeKey, { timestamp: Date.now() }, 5);
    } catch (error: any) {
      const errMsg = error instanceof Error ? error.message : String(error);
      const context = `userId=${user?.id}, platform=${
        req?.headers?.['user-agent'] ?? 'unknown'
      }, channel=${this.detectChannel(req)}, ip=${this.extractIpAddress(req)}`;
      logger.error(
        `Failed to save user login activity: ${errMsg} | ${context}`
      );
      // Do not re-throw; login should succeed even if activity tracking fails
    }
  }

  private parsePlatform(userAgent: string | undefined): string {
    if (!userAgent) return 'Unknown';

    const uaLower = userAgent.toLowerCase();

    // Detect explicit API / client signatures first
    const explicit = this.detectExplicitApiClient(uaLower);
    if (explicit) return explicit;

    const parser = new UAParser(userAgent);
    const result = parser.getResult();
    const deviceType = result.device.type;
    const osName = (result.os.name || '').toLowerCase();
    const browserName = (result.browser.name || '').toLowerCase();

    // Mobile / Tablet classification
    const mobileResult = this.classifyMobileOrTablet(deviceType, osName);
    if (mobileResult) return mobileResult;

    // Desktop classification
    if (!deviceType && this.isDesktopOs(osName)) {
      const desktopResult = this.classifyDesktopBrowser(browserName);
      return desktopResult ?? 'Desktop';
    }

    // Other device types
    if (deviceType) {
      const other = this.mapOtherDeviceType(deviceType);
      if (other) return other;
    }

    // Web fallback
    if (browserName) return 'Web';

    return 'Unknown';
  }

  private detectExplicitApiClient(uaLower: string): string | null {
    if (uaLower.includes('axios')) return 'API-Axios';
    if (uaLower.includes('postman')) return 'Postman';
    if (uaLower.includes('insomnia')) return 'Insomnia';
    if (uaLower.includes('curl')) return 'API-Curl';
    if (uaLower.includes('python-requests')) return 'API-Python';
    if (uaLower.includes('java')) return 'API-Java';
    if (uaLower.includes('okhttp')) return 'API-OkHttp';
    return null;
  }

  private classifyMobileOrTablet(
    deviceType: string | undefined,
    osName: string
  ): string | null {
    if (deviceType !== 'mobile' && deviceType !== 'tablet') return null;
    if (osName.includes('android')) {
      return deviceType === 'mobile' ? 'Mobile-Android' : 'Tablet-Android';
    }
    if (osName.includes('ios')) {
      return deviceType === 'mobile' ? 'Mobile-iOS' : 'Tablet-iOS';
    }
    return deviceType === 'mobile' ? 'Mobile' : 'Tablet';
  }

  private isDesktopOs(osName: string): boolean {
    return (
      osName.includes('windows') ||
      osName.includes('mac os') ||
      osName.includes('linux')
    );
  }

  private classifyDesktopBrowser(browserName: string): string | null {
    if (!browserName) return null;
    if (browserName.includes('chrome')) return 'Desktop-Chrome';
    if (browserName.includes('firefox')) return 'Desktop-Firefox';
    if (browserName.includes('safari') && !browserName.includes('chrome'))
      return 'Desktop-Safari';
    if (browserName.includes('edge')) return 'Desktop-Edge';
    if (browserName.includes('opera')) return 'Desktop-Opera';
    return null;
  }

  private mapOtherDeviceType(deviceType: string): string | null {
    const map: Record<string, string> = {
      smarttv: 'SmartTV',
      console: 'Console',
      wearable: 'Wearable',
      embedded: 'Embedded',
    };
    return map[deviceType] ?? null;
  }

  private detectChannel(req: Request): string {
    const explicitChannel = req.headers['x-channel'] || req.body?.channel;
    if (explicitChannel) {
      const channel = String(explicitChannel).toUpperCase();
      // Validate against allowed channels
      const allowedChannels = ['API', 'WEB', 'MOBILE'];
      return allowedChannels.includes(channel) ? channel : 'UNKNOWN';
    }

    const userAgent = req.headers['user-agent'] || '';
    const userAgentLower = userAgent.toLowerCase();

    // First, check for explicit API clients (most specific)
    if (
      userAgentLower.includes('axios') ||
      userAgentLower.includes('postman') ||
      userAgentLower.includes('curl') ||
      userAgentLower.includes('insomnia') ||
      userAgentLower.includes('okhttp') ||
      userAgentLower.includes('java') ||
      userAgentLower.includes('python-requests') ||
      userAgentLower.includes('node-fetch') ||
      userAgentLower.includes('wget')
    ) {
      return 'API';
    }

    // Use UAParser for accurate device/browser detection
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    const deviceType = result.device.type;
    const osName = (result.os.name || '').toLowerCase();
    const browserName = (result.browser.name || '').toLowerCase();

    // Mobile/Tablet devices (based on UAParser device type)
    if (deviceType === 'mobile' || deviceType === 'tablet') {
      return 'MOBILE';
    }

    // Check for mobile OS patterns as fallback
    if (
      osName.includes('android') ||
      osName.includes('ios') ||
      userAgentLower.includes('iphone') ||
      userAgentLower.includes('ipad') ||
      userAgentLower.includes('ipod')
    ) {
      return 'MOBILE';
    }

    // Desktop browsers (when we have a valid browser name)
    if (
      browserName &&
      (browserName.includes('chrome') ||
        browserName.includes('firefox') ||
        browserName.includes('safari') ||
        browserName.includes('edge') ||
        browserName.includes('opera') ||
        browserName.includes('internet explorer'))
    ) {
      return 'WEB';
    }

    // Fallback: if it looks like a browser but UAParser didn't detect it properly
    if (
      userAgentLower.includes('mozilla') &&
      (userAgentLower.includes('gecko') ||
        userAgentLower.includes('webkit') ||
        userAgentLower.includes('trident'))
    ) {
      return 'WEB';
    }

    return 'UNKNOWN';
  }

  private extractIpAddress(req: Request): string {
    // Normalize header access
    const headers = req.headers as Record<
      string,
      string | string[] | undefined
    >;

    // Helper to unify string/array header extraction
    const getHeaderValue = (key: string): string | undefined => {
      const val = headers[key];
      if (typeof val === 'string' && val.trim()) return val.trim();
      if (Array.isArray(val) && val.length && String(val[0]).trim())
        return String(val[0]).trim();
      return undefined;
    };

    // Ordered header checks: prefer Cloudflare, then common proxy headers
    const simpleHeaderCandidates = [
      'cf-connecting-ip',
      'x-client-ip',
      'x-real-ip',
    ];
    for (const key of simpleHeaderCandidates) {
      const v = getHeaderValue(key);
      if (v) return this.normalizeIpAddress(v);
    }

    // x-forwarded-for requires parsing the first entry if present
    const xForwardedFor = getHeaderValue('x-forwarded-for');
    if (xForwardedFor) {
      const first = xForwardedFor.split(',')[0]?.trim();
      if (first) return this.normalizeIpAddress(first);
    }

    // Fallbacks to express-provided ip and socket remote address
    const ipSource = req.ip ?? req.socket?.remoteAddress;
    if (ipSource) {
      return this.normalizeIpAddress(String(ipSource));
    }

    return 'Unknown';
  }

  private isValidIP(ip: string): boolean {
    if (!ip || ip === 'Unknown') return false;

    // IPv4 validation with proper range checking
    // Using .exec() instead of .match() for efficiency and to consistently extract capture groups,
    // as .exec() returns an array with matched groups, which is useful for octet validation below.
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const ipv4Match = ipv4Regex.exec(ip);
    if (ipv4Match) {
      // Check if each octet is in valid range (0-255)
      return ipv4Match.slice(1).every((octet) => {
        const num = parseInt(octet, 10);
        return num >= 0 && num <= 255;
      });
    }

    // IPv6 validation (more comprehensive)
    const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$|^::1$|^::$/;
    if (ipv6Regex.test(ip)) return true;

    // IPv6 with IPv4 suffix (e.g., ::ffff:192.168.1.1)
    const ipv6WithIpv4Regex =
      /^::ffff:(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const ipv6WithIpv4Match = ipv6WithIpv4Regex.exec(ip);
    if (ipv6WithIpv4Match) {
      return ipv6WithIpv4Match.slice(1).every((octet) => {
        const num = parseInt(octet, 10);
        return num >= 0 && num <= 255;
      });
    }

    return false;
  }

  private normalizeIpAddress(ip: string): string {
    if (!ip || ip === 'Unknown') return 'Unknown';

    ip = ip.trim();

    // Validate IP format before processing
    if (!this.isValidIP(ip)) {
      return 'Unknown';
    }

    if (ip === '::1' || ip === '::ffff:127.0.0.1' || ip === '0:0:0:0:0:0:0:1') {
      return '127.0.0.1';
    }

    if (ip.startsWith('::ffff:')) {
      const ipv4Part = ip.substring(7);
      if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ipv4Part)) {
        return ipv4Part;
      }
    }

    if (ip.toLowerCase().includes('localhost')) {
      return '127.0.0.1';
    }

    return ip;
  }

  private async generateToken(user: any, tokenRole: any = null, tokenCustomer: any = null) {
    if (user?.asRole && !tokenRole) {
      const role = user.userRoles.find((r: any) => r.role.name === user.asRole);
      if (role) {
        tokenRole = {
          id: role.role.id,
          name: role.role.name,
        };
      }
    }
    const roleId = tokenRole?.id || user.userRoles[0]?.role.id;
    const asRole = tokenRole?.name || user.userRoles[0]?.role.name;
    const roles = user.userRoles.map((role: any) => ({
      id: role.role.id,
      name: role.role.name,
      description: role.description,
      warehouses: (role.warehouses || []).map((w: any) => w.warehouseId),
      customers: Array.from(
        new Set(
          (role.warehouses || [])
            .map((w: any) => w.warehouse?.customerId)
            .filter(Boolean),
        ),
      ),
    }));

    // Multi-tenant: Customer = tenant. Active tenant defaults to first accessible.
    const accessibleCustomers = Array.from(
      new Set(
        roles.flatMap((r: any) => r.customers),
      ),
    );
    const activeCustomerId =
      tokenCustomer?.id || accessibleCustomers[0] || null;

    // klaim warehouse & customer (code/name) untuk validasi akses
    // warehouse (mis. upload AHM) — stateless, dibawa di JWT.
    // Warehouse dibatasi ke ROLE AKTIF saja (konsisten dengan menus).
    const activeUserRole = user.userRoles.find(
      (ur: any) => ur.role?.id === roleId,
    );
    const allUserRoleWarehouses = activeUserRole?.warehouses || [];
    const accessibleWarehouses = Array.from(
      new Map<string, { warehouseCode: string; warehouseName: string | null }>(
        allUserRoleWarehouses
          .filter((w: any) => w.warehouse?.code)
          .map((w: any) => [
            w.warehouse.code,
            {
              warehouseCode: w.warehouse.code,
              warehouseName: w.warehouse.name ?? null,
            },
          ]),
      ).values(),
    );
    const activeCustomer =
      allUserRoleWarehouses.find(
        (w: any) => w.warehouse?.customerId === activeCustomerId,
      )?.warehouse?.customer ?? null;

    // menus di klaim JWT — verifikasi stateless tanpa cache/Redis
    const userMenus = roleId
      ? await this.userRepository.getUserAccessibleMenusByRole(user.id, roleId)
      : [];

    const payloadAccess: IPayloadJwt = {
      sub: user.id,
      iss: SecretManager.env.BASE_URL,
      type: 'access',
      customerId: activeCustomerId,
      email: user.email,
      name: user.name,
      role: asRole,
      roleId: roleId,
      roles: roles,
      menus: userMenus,
      customerCode: activeCustomer?.code ?? null,
      customerName: activeCustomer?.name ?? null,
      warehouses: accessibleWarehouses,
    };

    const payloadRefresh: IPayloadJwt = {
      sub: user.id,
      iss: SecretManager.env.BASE_URL,
      type: 'refresh',
      roleId: roleId,
    };

    const accessToken = jwt.sign(payloadAccess, SecretManager.env.JWT_SECRET, {
      expiresIn: SecretManager.env.JWT_ACCESS_EXPIRES_IN,
    });
    const refreshToken = jwt.sign(
      payloadRefresh,
      SecretManager.env.JWT_SECRET,
      {
        expiresIn: SecretManager.env.JWT_REFRESH_EXPIRES_IN,
      }
    );

    // Encrypt the access token for enhanced security
    const encryptedAccessToken = TokenEncryption.encrypt(accessToken);

    return {
      type: 'bearer',
      accessToken: encryptedAccessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: roleId,
        roleName: asRole,
        roles: roles,
        customerId: activeCustomerId,
        customers: accessibleCustomers,
        isInternal: 1,
      },
    };
  }

  /**
   * Simpan session user ke Redis — dibaca lintas service (auth terpusat).
   */
  private async storeToRedis(
    user: any,
    accessToken: string,
    tokenRoleName: string = null,
    activeCustomerId: string = null
  ) {
    const activeRole = tokenRoleName
      ? user.userRoles.find((ur: any) => ur.role.name === tokenRoleName)?.role
      : user.userRoles[0]?.role;

    const userMenus = activeRole?.id
      ? await this.userRepository.getUserAccessibleMenusByRole(
          user.id,
          activeRole.id
        )
      : [];

    const data = {
      id: user.id,
      token: accessToken,
      email: user.email,
      name: user.name,
      role: tokenRoleName || user.userRoles[0]?.role.name,
      customerId: activeCustomerId,
      roles: user.userRoles.map((role: any) => ({
        id: role.role.id,
        name: role.role.name,
        description: role.description,
        warehouses: (role.warehouses || []).map((w: any) => w.warehouseId),
        customers: Array.from(
          new Set(
            (role.warehouses || [])
              .map((w: any) => w.warehouse?.customerId)
              .filter(Boolean),
          ),
        ),
      })),
      menus: userMenus || [],
    };

    await cache.delete(`tokenAccess:${user.id}`);
    await cache.set(`tokenAccess:${user.id}`, data);
  }

}