import {
  BaseHttpController,
  controller,
  httpDelete,
  httpGet,
  httpPost,
  httpPut,
  request,
  requestParam,
} from 'inversify-express-utils';
import { inject } from 'inversify';
import {
  BodyValidation,
  ParamValidation,
  QueryValidation,
} from '@/shared-libs/base';
import { ControllerLogging } from '@/shared-libs/helpers/logging.helper';
import { MICROSERVICE_IDENTIFIERS } from '@/shared-libs/constants';
import { ValidatePermissions } from '@/shared-libs/decorators/permission-interceptor.decorator';
import {
  UpdateByIdDto,
  ListDto,
  DetailDto,
  CreatePermissionDto,
} from './dtos/';
import { CommandService } from './command.service';
import { QueryService } from './query.service';
import { Request } from 'express';

/**
 * @swagger
 * tags:
 *   - name: User Access
 *     description: User access management endpoints
 */
@controller('/v1/users-access')
export class UserAccessController extends BaseHttpController {
  // Create user-access specific logging helpers
  private static readonly userAccessLogging = ControllerLogging.forEntity(
    'user-access',
    MICROSERVICE_IDENTIFIERS.SERVICE_USER
  );

  constructor(
    @inject(CommandService) private readonly commandService: CommandService,
    @inject(QueryService) private readonly queryService: QueryService
  ) {
    super();
  }

  /**
   * @swagger
   * /v1/users-access/role-menu:
   *   get:
   *     summary: Get menu access by role
   *     tags: [User Access]
   *     security:
   *       - bearerAuth: []
   *       - api_key: []
   *     responses:
   *       200:
   *         description: Successfully retrieved menu access
   *       401:
   *         description: Unauthorized
   */
  @ValidatePermissions({ menuCode: 'UAM', action: 'READ' })
  @httpGet(
    '/role-menu',
    QueryValidation(ListDto),
    UserAccessController.userAccessLogging.custom('get-user-role-menu')
  )
  async byRole(@request() req: any) {
    return await this.queryService.byRole(req);
  }

  /**
   * @swagger
   * /v1/users-access/{id}:
   *   get:
   *     summary: Get user access by ID
   *     tags: [User Access]
   *     security:
   *       - bearerAuth: []
   *       - api_key: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: User access ID
   *     responses:
   *       200:
   *         description: Successfully retrieved user access
   *       400:
   *         description: Invalid ID supplied
   *       404:
   *         description: User access not found
   */

  @ValidatePermissions({ menuCode: 'UAM', action: 'READ' })
  @httpGet(
    '/:id',
    ParamValidation(DetailDto),
    UserAccessController.userAccessLogging.view
  )
  async byId(@requestParam('id') id: string) {
    return await this.queryService.byId(id);
  }

  /**
   * @swagger
   * /v1/users-access:
   *   get:
   *     summary: Get all user access records
   *     tags: [User Access]
   *     security:
   *       - bearerAuth: []
   *       - api_key: []
   *     responses:
   *       200:
   *         description: Successfully retrieved all user access records
   *       401:
   *         description: Unauthorized
   */

  @httpGet('/', UserAccessController.userAccessLogging.list)
  async getAll(@request() req: any) {
    return await this.queryService.getAll(req);
  }

  /**
   * @swagger
   * /v1/users-access/{id}:
   *   put:
   *     summary: Update user access by ID
   *     tags: [User Access]
   *     security:
   *       - bearerAuth: []
   *       - api_key: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: User access ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateByIdDto'
   *     responses:
   *       200:
   *         description: Successfully updated user access
   *       400:
   *         description: Invalid request payload
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: User access not found
   */

  @ValidatePermissions({ menuCode: 'UAM', action: 'UPDATE' })
  @httpPut(
    '/:id',
    ParamValidation(DetailDto),
    BodyValidation(UpdateByIdDto),
    UserAccessController.userAccessLogging.update
  )
  async updateById(@requestParam('id') id: string, @request() req: any) {
    return await this.commandService.updateById(id, req);
  }

  /**
   * @swagger
   * /v1/users-access:
   *   post:
   *     summary: Create a new user access record
   *     tags: [User Access]
   *     security:
   *       - bearerAuth: []
   *       - api_key: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreatePermissionDto'
   *     responses:
   *       201:
   *         description: Successfully created user access
   *       400:
   *         description: Invalid request payload
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Related entity not found
   */
  @ValidatePermissions({ menuCode: 'UAM', action: 'CREATE' })
  @httpPost(
    '/',
    BodyValidation(CreatePermissionDto),
    UserAccessController.userAccessLogging.create
  )
  async create(@request() req: any) {
    return await this.commandService.create(req);
  }

  @ValidatePermissions({ menuCode: 'UAM', action: 'DELETE' })
  /**
   * @swagger
   * /v1/users-access/{id}:
   *   delete:
   *     summary: Delete user access by ID
   *     tags: [User Access]
   *     security:
   *       - bearerAuth: []
   *       - api_key: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: User access ID
   *     responses:
   *       200:
   *         description: Successfully deleted user access
   *       400:
   *         description: Invalid ID supplied
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: User access not found
   */
  @ValidatePermissions({ menuCode: 'UAM', action: 'DELETE' })
  @httpDelete(
    '/:id',
    ParamValidation(DetailDto),
    UserAccessController.userAccessLogging.delete
  )
  async deleteById(@requestParam('id') id: string, @request() req: Request) {
    return await this.commandService.deleteById(id, req);
  }
}
