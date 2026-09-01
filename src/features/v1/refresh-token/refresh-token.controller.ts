/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: Token management
 *
 * /v1/refresh-token:
 *   get:
 *     summary: Refresh authentication token
 *     description: Retrieves a new access token using the refresh token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *       - api_key: []
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         description: Bearer refresh token
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: New access token generated successfully
 *       401:
 *         description: Unauthorized or invalid refresh token
 *       500:
 *         description: Internal server error
 */
import {
  BaseHttpController,
  controller,
  httpGet,
  request,
} from 'inversify-express-utils';
import { inject } from 'inversify';
import { withLogging } from '@/shared-libs/helpers/logging.helper';
import { MICROSERVICE_IDENTIFIERS } from '@/shared-libs/constants';
import { RefreshTokenService } from './refresh-token.service';

@controller('/v1/refresh-token')
export class RefreshToken extends BaseHttpController {
  constructor(
    @inject(RefreshTokenService)
    private readonly refreshTokenService: RefreshTokenService
  ) {
    super();
  }

  @httpGet(
    '/',
    withLogging('refresh-auth-token', MICROSERVICE_IDENTIFIERS.SERVICE_USER)
  )
  async refreshToken(@request() req: any) {
    return await this.refreshTokenService.refreshToken(req);
  }
}
