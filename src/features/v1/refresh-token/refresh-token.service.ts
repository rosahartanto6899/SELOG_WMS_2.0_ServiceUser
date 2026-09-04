import jwt from 'jsonwebtoken';
import { injectable, inject } from 'inversify';
import { HTTP_STATUS } from '@/shared-libs/constants/http-status.constant';
import {
  UnauthorizedException,
  ForbiddenException,
} from '@/shared-libs/exceptions';
import { default as cache } from '@/shared-libs/utils/cache.util'; // restore: shared Redis session store (cross-service auth)
import { default as SecretManager } from '@/shared-libs/utils/secret-manager.util';
import { TokenEncryption } from '@/shared-libs/utils/token-encryption.util';
import { UserRepository } from './repositories';
import { IPayloadJwt } from './interfaces/refresh-token.interface';

@injectable()
export class RefreshTokenService {
  constructor(
    @inject(UserRepository) private readonly userRepository: UserRepository
  ) {}

  async refreshToken(req: any) {
    const blaklistRefreshToken = req.headers.authorization?.split(' ')[1];
    const tokenBlacklist = await cache.get<{ token: string }>(
      'tokenBlacklist:' + blaklistRefreshToken
    );
    if (tokenBlacklist !== null) {
      throw new UnauthorizedException('Unauthorized');
    }

    const decode = this.validateToken(blaklistRefreshToken);
    const user = await this.userRepository.getById(decode.sub);

    const data = await this.generateToken(user, blaklistRefreshToken);

    return {
      data: data,
      httpCode: HTTP_STATUS.OK,
    };
  }

  private validateToken(blaklistRefreshToken: string) {
    let decode: any;
    try {
      decode = jwt.verify(
        blaklistRefreshToken,
        SecretManager.env.JWT_SECRET
      ) as {
        sub: string;
        type: string;
      };
    } catch {
      // missing/malformed/expired/bad-signature token = auth failure, not 500
      throw new UnauthorizedException('Unauthorized');
    }

    if (decode.type == 'access') {
      throw new ForbiddenException('Forbidden');
    }

    return decode;
  }
  private async generateToken(user: any, blaklistRefreshToken: string) {
    // Determine the active role ID
    const activeRole = user.userRoles.find(
      (ur: any) => ur.role.name === user.asRole
    )?.role;
    const activeRoleId = activeRole?.id;

    // identity is rebuilt from the DB and stored in the Redis session
    const userMenus = activeRoleId
      ? await this.userRepository.getUserAccessibleMenusByRole(
          user.id,
          activeRoleId
        )
      : [];

    const roles = user.userRoles.map((role: any) => ({
      id: role.role.id,
      name: role.role.name,
      description: role.role.description,
      warehouses: (role.warehouses || []).map((w: any) => w.warehouseId),
      customers: Array.from(
        new Set(
          (role.warehouses || [])
            .map((w: any) => w.warehouse?.customerId)
            .filter(Boolean),
        ),
      ),
    }));

    // warehouse & customer (code/name) for warehouse access validation.
    // Warehouses are limited to the ACTIVE ROLE only (consistent with menus).
    const allUserRoleWarehouses =
      user.userRoles.find(
        (ur: any) => ur.role?.name === user.asRole,
      )?.warehouses || [];
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
    const activeCustomerId =
      allUserRoleWarehouses.find((w: any) => w.warehouse?.customerId)
        ?.warehouse?.customerId ?? null;
    const activeCustomer =
      allUserRoleWarehouses.find(
        (w: any) => w.warehouse?.customerId === activeCustomerId,
      )?.warehouse?.customer ?? null;

    const payloadAccess: IPayloadJwt = {
      sub: user.id,
      iss: SecretManager.env.BASE_URL,
      type: 'access',
    };

    const payloadRefresh: IPayloadJwt = {
      sub: user.id,
      iss: SecretManager.env.BASE_URL,
      type: 'refresh',
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

    // Refresh token rotation: blacklist the old token so it can't be reused
    await cache.set(
      'tokenBlacklist:' + blaklistRefreshToken,
      blaklistRefreshToken,
      60
    );

    // Cross-service session store (centralized auth in Redis), TTL = access token lifetime
    await cache.set(
      `tokenAccess:${user.id}`,
      {
        id: user.id,
        token: encryptedAccessToken,
        email: user.email,
        name: user.name,
        role: user.asRole,
        customerId: activeCustomerId,
        customerCode: activeCustomer?.code ?? null,
        customerName: activeCustomer?.name ?? null,
        roles: roles,
        menus: userMenus,
        warehouses: accessibleWarehouses,
      },
      Number(SecretManager.env.JWT_ACCESS_EXPIRES_IN),
    );

    return {
      type: 'bearer',
      accessToken: encryptedAccessToken,
      refreshToken,
    };
  }
}
