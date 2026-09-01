import {
  BaseHttpController,
  controller,
  httpPost,
  request,
} from 'inversify-express-utils';
import { inject } from 'inversify';
import { BodyValidation } from '@/shared-libs/base';
import { withLogging } from '@/shared-libs/helpers/logging.helper';
import { MICROSERVICE_IDENTIFIERS } from '@/shared-libs/constants';
import { ByProviderDto, LocalLoginDto, SwitchRoleDto, SwitchCustomerDto } from './dtos/login.dto';
import { LoginService } from './command.service';

/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: User authentication endpoints
 */

@controller('/v1/login')
export class LoginController extends BaseHttpController {
  constructor(
    @inject(LoginService) private readonly loginService: LoginService
  ) {
    super();
  }

  /**
   * @swagger
   * /v1/login:
   *   post:
   *     summary: Login with an external provider
   *     tags: [Authentication]
   *     security:
   *       - api_key: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ByProviderDto'
   *     responses:
   *       200:
   *         description: Successful login
   *       400:
   *         description: Invalid request payload
   *       401:
   *         description: Unauthorized
   */
  @httpPost(
    '/',
    BodyValidation(ByProviderDto),
    withLogging('user-login', MICROSERVICE_IDENTIFIERS.SERVICE_USER)
  )
  async byProvider(@request() req: any) {
    return await this.loginService.login(req);
  }

  @httpPost(
    '/local',
    BodyValidation(LocalLoginDto),
    withLogging('user-login-local', MICROSERVICE_IDENTIFIERS.SERVICE_USER)
  )
  async loginLocal(@request() req: any) {
    return await this.loginService.loginLocal(req);
  }

  /**
   * @swagger
   * /v1/login/switch-role:
   *   post:
   *     summary: Switch user role
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *       - api_key: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/SwitchRoleDto'
   *     responses:
   *       200:
   *         description: Role switched successfully
   *       400:
   *         description: Invalid request payload
   *       401:
   *         description: Unauthorized
   */
  @httpPost(
    '/switch-role',
    BodyValidation(SwitchRoleDto),
    withLogging('switch-user-role', MICROSERVICE_IDENTIFIERS.SERVICE_USER)
  )
  async switchRole(@request() req: any) {
    return await this.loginService.switchRole(req);
  }

  /**
   * @swagger
   * /v1/login/switch-customer:
   *   post:
   *     summary: Switch active customer (tenant)
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *       - api_key: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/SwitchCustomerDto'
   *     responses:
   *       200:
   *         description: Tenant switched successfully
   *       401:
   *         description: Unauthorized
   */
  @httpPost(
    '/switch-customer',
    BodyValidation(SwitchCustomerDto),
    withLogging('switch-customer', MICROSERVICE_IDENTIFIERS.SERVICE_USER)
  )
  async switchCustomer(@request() req: any) {
    return await this.loginService.switchCustomer(req);
  }
}
