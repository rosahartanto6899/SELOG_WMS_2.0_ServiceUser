import {
  BaseHttpController,
  controller,
  httpDelete,
  request,
  requestParam,
  httpPost,
  httpPut,
  httpGet,
} from 'inversify-express-utils';
import { inject } from 'inversify';
import { Request } from 'express';
import {
  BodyValidation,
  ParamValidation,
  QueryValidation,
} from '@/shared-libs/base';
import { ControllerLogging } from '@/shared-libs/helpers/logging.helper';
import { MICROSERVICE_IDENTIFIERS } from '@/shared-libs/constants';
import { ValidatePermissions } from '@/shared-libs/decorators/permission-interceptor.decorator';
import {
  CreateDto,
  UpdateDto,
  DetailDto,
  ListDto,
  GetByRoleDto,
  GetByRoleQueryDto,
  GetByRoleIdsDto,
  GetByIdsDto,
} from '@/features/v1/users/dtos';
import { CommandService } from './command.service';
import { QueryService } from './query.service';
/**
 * @swagger
 * tags:
 *   - name: User Management
 *     description: Endpoints for managing users
 */

@controller('/v1/users')
export class UserController extends BaseHttpController {
  // Create user-specific logging helpers
  private static readonly userLogging = ControllerLogging.forEntity(
    'users',
    MICROSERVICE_IDENTIFIERS.SERVICE_USER,
  );

  constructor(
    @inject(CommandService) private readonly commandService: CommandService,
    @inject(QueryService) private readonly queryService: QueryService,
  ) {
    super();
  }

  /**
   * @swagger
   * /v1/users:
   *   post:
   *     summary: Create a new user
   *     tags: [User Management]
   *     security:
   *       - bearerAuth: []
   *       - api_key: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateDtoUser'
   *     responses:
   *       201:
   *         description: User created successfully
   */
  @ValidatePermissions({ menuCode: 'USER', action: 'CREATE' })
  @httpPost('/', BodyValidation(CreateDto), UserController.userLogging.create)
  async create(@request() req: Request) {
    return await this.commandService.create(req);
  }

  /**
   * @swagger
   * /v1/users/ids/role:
   *   post:
   *     summary: Get users by role IDs
   *     tags: [User Management]
   *     security:
   *       - basicAuth: []
   *       - api_key: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/GetByRoleIdsDto'
   *     responses:
   *       200:
   *         description: List of users with the specified role IDs
   *       401:
   *        description: Unauthorized
   *       422:
   *        description: Validation Error
   *       500:
   *        description: Internal Server Error
   */
  @httpPost('/ids/role', BodyValidation(GetByRoleIdsDto))
  async getByRoleIds(@request() req: Request) {
    return await this.queryService.getByRoleIds(req);
  }

  /**
   * @swagger
   * /v1/users/ids/:
   *   post:
   *     summary: Get users by role IDs
   *     tags: [User Management]
   *     security:
   *       - basicAuth: []
   *       - api_key: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/GetByIdsDto'
   *     responses:
   *       200:
   *         description: List of users with the specified role IDs
   *       401:
   *        description: Unauthorized
   *       422:
   *        description: Validation Error
   *       500:
   *        description: Internal Server Error
   */
  @httpPost('/ids/', BodyValidation(GetByIdsDto))
  async getByIds(@request() req: Request) {
    return await this.queryService.getByIds(req);
  }

  /**
   * @swagger
   * /v1/users/{id}:
   *   put:
   *     summary: Update user by ID
   *     tags: [User Management]
   *     security:
   *       - bearerAuth: []
   *       - api_key: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateDtoUser'
   *     responses:
   *       200:
   *         description: User updated successfully
   */
  @ValidatePermissions({ menuCode: 'USER', action: 'UPDATE' })
  @httpPut(
    '/:id',
    ParamValidation(DetailDto),
    BodyValidation(UpdateDto),
    UserController.userLogging.update,
  )
  async update(@requestParam('id') id: string, @request() req: Request) {
    return await this.commandService.update(id, req);
  }

  /**
   * @swagger
   * /v1/users/{id}:
   *   delete:
   *     summary: Delete user by ID
   *     tags: [User Management]
   *     security:
   *       - bearerAuth: []
   *       - api_key: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: User deleted successfully
   */
  @ValidatePermissions({ menuCode: 'USER', action: 'DELETE' })
  @httpDelete(
    '/:id',
    ParamValidation(DetailDto),
    UserController.userLogging.delete,
  )
  async delete(@requestParam('id') id: string, @request() req: Request) {
    return await this.commandService.delete(id, req);
  }

  /**
   * @swagger
   * /v1/users/{id}:
   *   get:
   *     summary: Get user by ID
   *     tags: [User Management]
   *     security:
   *       - bearerAuth: []
   *       - api_key: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: User data
   */

  @ValidatePermissions({
    allowedMenuPermissions: [
      { menuCode: 'USER', action: 'READ' },
      { menuCode: 'ORDER-STATUS', action: 'READ' },
    ],
  })
  @httpGet('/:id', ParamValidation(DetailDto), UserController.userLogging.view)
  async byId(@requestParam('id') id: string) {
    return await this.queryService.byId(id);
  }

  /**
   * @swagger
   * /v1/users/{id}/branch/count:
   *   get:
   *     summary: Count user by branch id
   *     tags: [User Management]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: User data
   */
  @httpGet('/:id/branch/count', ParamValidation(DetailDto))
  async countByBranchId(@requestParam('id') id: string) {
    return await this.queryService.countByBranchId(id);
  }

  /**
   * @swagger
   * /v1/users:
   *   get:
   *     summary: Get all users
   *     tags: [User Management]
   *     security:
   *       - bearerAuth: []
   *       - api_key: []
   *     responses:
   *       200:
   *         description: List of users
   */
  @ValidatePermissions({ menuCode: 'USER', action: 'READ' })
  @httpGet('/', QueryValidation(ListDto), UserController.userLogging.list)
  async getAll(@request() req: Request) {
    return await this.queryService.getAll(req);
  }

  /**
   * @swagger
   * /v1/users/{id}/role:
   *   get:
   *     summary: Get users by role ID
   *     tags: [User Management]
   *     security:
   *       - bearerAuth: []
   *       - api_key: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: UUID of the role
   *       - in: query
   *         name: branchId
   *         required: false
   *         schema:
   *           type: string
   *         description: Optional UUID of the branch to filter users
   *     responses:
   *       200:
   *         description: List of users with the specified role and optional branch
   */
  @httpGet(
    '/:roleId/role',
    ParamValidation(GetByRoleDto),
    QueryValidation(GetByRoleQueryDto),
  )
  async getByRoleId(
    @requestParam('roleId') roleId: string,
    @request() req: Request,
  ) {
    const branchId = req.query.branchId as string | undefined;
    return await this.queryService.getByRoleId(roleId, branchId);
  }

  /**
   * @swagger
   * /v1/users/sales/dropdown:
   *   get:
   *     summary: Get sales dropdown
   *     tags: [User Management]
   *     security:
   *       - bearerAuth: []
   *       - api_key: []
   *     responses:
   *       200:
   *         description: List dropdown of sales
   */
  @ValidatePermissions({
    allowedMenuPermissions: [
      { menuCode: 'CUSTOMER', action: 'READ' },
      { menuCode: 'CUSTOMER', action: 'UPDATE' },
      { menuCode: 'BOOKING-ORDER', action: 'READ' },
      { menuCode: 'BOOKING-ORDER', action: 'CREATE' },
      { menuCode: 'BOOKING-ORDER', action: 'UPDATE' },
    ],
  })
  @httpGet('/sales/dropdown')
  async salesDropdown() {
    return await this.queryService.getSalesDropdown();
  }

  /**
   * @swagger
   * /v1/users/internal/{id}:
   *   get:
   *     summary: Get users by ID using basic auth
   *     tags: [User Management]
   *     security:
   *       - basicAuth: []
   *       - api_key: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Role ID
   *     responses:
   *       200:
   *         description: Successfully retrieved role
   *       404:
   *         description: User not found
   *       401:
   *         description: Unauthorized
   */
  @httpGet(
    '/internal/:id',
    ParamValidation(DetailDto),
    UserController.userLogging.view,
  )
  async internalById(@requestParam('id') id: string) {
    return await this.queryService.byId(id);
  }
}
