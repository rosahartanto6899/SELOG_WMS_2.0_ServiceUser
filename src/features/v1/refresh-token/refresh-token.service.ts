import jwt from 'jsonwebtoken';
import { injectable, inject } from 'inversify';
import { HTTP_STATUS } from '@/shared-libs/constants/http-status.constant';
import {
  UnauthorizedException,
  ForbiddenException,
} from '@/shared-libs/exceptions';
// import { default as cache } from '@/shared-libs/utils/cache.util'; // ponytail: sementara pakai memory-cache (tanpa Redis)
import { default as cache } from '@/utils/memory-cache.util';
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

    const data = await this.generateToken(user, blaklistRefreshToken, decode);

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
  private async generateToken(
    user: any,
    blaklistRefreshToken: string,
    decode: any
  ) {
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

    await this.storeToRedis(encryptedAccessToken, blaklistRefreshToken, decode);

    return {
      type: 'bearer',
      accessToken: encryptedAccessToken,
      refreshToken,
    };
  }

  private async storeToRedis(
    encryptedAccessToken: string,
    blaklistRefreshToken: string,
    decode: any
  ): Promise<void> {
    const { sub } = decode;

    const user = await this.userRepository.getById(sub);

    // Determine the active role ID
    const activeRole = user.userRoles.find(
      (ur: any) => ur.role.name === user.asRole
    )?.role;

    const activeRoleId = activeRole?.id;

    // Get user accessible menus for the active role only
    const userMenus = activeRoleId
      ? await this.userRepository.getUserAccessibleMenusByRole(
          user.id,
          activeRoleId
        )
      : [];

    let data = {
      id: sub,
      token: encryptedAccessToken,
      email: user.email,
      name: user.name,
      role: user.asRole,
      roles: [],
      menus: userMenus,
    };

    data.roles = user.userRoles.map((role) => ({
      id: role.role.id,
      name: role.role.name,
      description: role.role.description,
      branches: role.branches.map((branch) => branch.branchId),
    }));

    await cache.set(
      'tokenBlacklist:' + blaklistRefreshToken,
      blaklistRefreshToken,
      60
    );
    await cache.set(`tokenAccess:${user.id}`, data);
  }
}
