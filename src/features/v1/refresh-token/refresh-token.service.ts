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

    // identitas di klaim JWT — verifikasi stateless tanpa cache/Redis
    const userMenus = activeRoleId
      ? await this.userRepository.getUserAccessibleMenusByRole(
          user.id,
          activeRoleId
        )
      : [];

    const roles = user.userRoles.map((role) => ({
      id: role.role.id,
      name: role.role.name,
      description: role.role.description,
      branches: role.branches.map((branch) => branch.branchId),
    }));

    // klaim warehouse & customer (code/name) untuk validasi akses warehouse.
    // Warehouse dibatasi ke ROLE AKTIF saja (konsisten dengan menus).
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
      email: user.email,
      name: user.name,
      role: user.asRole,
      roleId: activeRoleId,
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

    // Rotasi refresh token: blacklist token lama agar tidak dipakai ulang
    await cache.set(
      'tokenBlacklist:' + blaklistRefreshToken,
      blaklistRefreshToken,
      60
    );

    // Session store lintas service (auth terpusat di Redis)
    await cache.set(`tokenAccess:${user.id}`, {
      id: user.id,
      token: encryptedAccessToken,
      email: user.email,
      name: user.name,
      role: user.asRole,
      roles: roles,
      menus: userMenus,
    });

    await cache.set(
      'tokenBlacklist:' + blaklistRefreshToken,
      blaklistRefreshToken,
      60
    );
    await cache.set(
      `tokenAccess:${user.id}`,
      data,
      Number(SecretManager.env.JWT_ACCESS_EXPIRES_IN),
    );
  }
}
