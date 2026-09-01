import {
  BaseHttpController,
  controller,
  httpGet,
  request,
} from 'inversify-express-utils';
import { inject } from 'inversify';
import { withLogging } from '@/shared-libs/helpers/logging.helper';
import { MICROSERVICE_IDENTIFIERS } from '@/shared-libs/constants';
import { LogoutService } from './logout.service';

/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: User authentication endpoints
 */

@controller('/v1/logout')
export class LogoutController extends BaseHttpController {
  constructor(
    @inject(LogoutService) private readonly logoutService: LogoutService
  ) {
    super();
  }

  /**
   * @swagger
   * /v1/logout:
   *   get:
   *     summary: Logout the current user
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *       - api_key: []
   *     responses:
   *       200:
   *         description: Successfully logged out
   *       401:
   *         description: Unauthorized
   */
  @httpGet(
    '/',
    withLogging('user-logout', MICROSERVICE_IDENTIFIERS.SERVICE_USER)
  )
  async logout(@request() req: any) {
    return await this.logoutService.logout(req);
  }
}
