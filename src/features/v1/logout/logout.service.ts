import { injectable } from 'inversify';
import { HTTP_STATUS } from '@/shared-libs/constants/http-status.constant';
import { default as cache } from '@/shared-libs/utils/cache.util';
import { TokenEncryption } from '@/shared-libs/utils/token-encryption.util';

@injectable()
export class LogoutService {
  /**
   * Logout user by blacklisting the JWT token (server-side, di Redis).
   * @param req Express request object.
   * @returns {Promise<Object>} An object containing the response data and HTTP code.
   */
  async logout(req: any): Promise<any> {
    const encryptedToken = req.headers.authorization?.split(' ')[1];

    if (encryptedToken) {
      try {
        // Decrypt the token to get the actual JWT for blacklisting
        let token: string;
        if (TokenEncryption.isEncryptedToken(encryptedToken)) {
          token = TokenEncryption.decrypt(encryptedToken);
        } else {
          // Fallback for non-encrypted tokens (backward compatibility)
          token = encryptedToken;
        }

        // Blacklist the decrypted JWT token
        await cache.set(`tokenBlacklist:${token}`, { token });

        // Also clean up the tokenAccess entry
        const userToken = req.user;
        if (userToken?.tokenUserId) {
          await cache.delete(`tokenAccess:${userToken.tokenUserId}`);
        }
      } catch (error) {
        // Log error but don't fail logout
        console.error('Error during token processing in logout:', error);
      }
    }

    return {
      data: null,
      httpCode: HTTP_STATUS.OK,
    };
  }
}
