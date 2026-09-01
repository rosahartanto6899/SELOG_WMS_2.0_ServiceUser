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
import { CreateDto, UpdateDto, DetailDto, ListDto } from './dtos';
import { CommandService } from './command.service';
import { QueryService } from './query.service';
/**
 * @swagger
 * tags:
 *   - name: Roles
 *     description: Role management endpoints
 */
@controller('/v1/roles')
export class RoleController extends BaseHttpController {
  // Create role-specific logging helpers
  private static readonly roleLogging = ControllerLogging.forEntity(
    'roles',
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
   * /v1/roles:
   *   get:
   *     summary: Get all roles
   *     tags: [Roles]
   *     security:
   *       - bearerAuth: []
   *       - api_key: []
   *     responses:
   *       200:
   *         description: Successfully retrieved roles
   *       401:
   *         description: Unauthorized
   */
  @ValidatePermissions({ menuCode: 'ROLE', action: 'READ' })
  @httpGet('/', QueryValidation(ListDto), RoleController.roleLogging.list)
  async getAll(@request() req: any) {
    return await this.queryService.getAll(req);
  }

  /**
   * @swagger
   * /v1/roles:
   *   post:
   *     summary: Create a new role
   *     tags: [Roles]
   *     security:
   *       - bearerAuth: []
   *       - api_key: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateDtoRoles'
   *     responses:
   *       201:
   *         description: Role created successfully
   *       400:
   *         description: Invalid request payload
   *       401:
   *         description: Unauthorized
   */
  @ValidatePermissions({ menuCode: 'ROLE', action: 'CREATE' })
  @httpPost('/', BodyValidation(CreateDto), RoleController.roleLogging.create)
  async create(@request() req: any) {
    return await this.commandService.create(req);
  }

  /**
   * @swagger
   * /v1/roles/dropdown:
   *   get:
   *     summary: Get roles in dropdown format
   *     tags: [Roles]
   *     security:
   *       - bearerAuth: []
   *       - api_key: []
   *     responses:
   *       200:
   *         description: Successfully retrieved dropdown roles
   *       401:
   *         description: Unauthorized
   */

  @ValidatePermissions({
    allowedMenuPermissions: [
      { menuCode: 'ROLE', action: 'READ' },
      { menuCode: 'USER', action: 'READ' },
      { menuCode: 'USER', action: 'CREATE' },
      { menuCode: 'USER', action: 'UPDATE' },
    ],
  })
  @httpGet('/dropdown', RoleController.roleLogging.dropdown)
  async dropdown(@request() req: any) {
    return await this.queryService.dropdown(req);
  }

  /**
   * @swagger
   * /v1/roles/internal/{id}:
   *   get:
   *     summary: Get role by ID using basic auth
   *     tags: [Roles]
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
   *         description: Role not found
   *       401:
   *         description: Unauthorized
   */
  @httpGet(
    '/internal/:id',
    ParamValidation(DetailDto),
    RoleController.roleLogging.view,
  )
  async internalById(@requestParam('id') id: any) {
    return await this.queryService.byId(id);
  }

  /**
   * @swagger
   * /v1/roles/{id}:
   *   get:
   *     summary: Get role by ID
   *     tags: [Roles]
   *     security:
   *       - bearerAuth: []
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
   *         description: Role not found
   *       401:
   *         description: Unauthorized
   */

  @ValidatePermissions({
    allowedMenuPermissions: [
      { menuCode: 'ROLE', action: 'READ' },
      { menuCode: 'UAM', action: 'READ' },
      { menuCode: 'UAM', action: 'UPDATE' },
      { menuCode: 'UAM', action: 'CREATE' },
      { menuCode: 'OUTSTANDING-APPROVAL', action: 'UPDATE' },
      { menuCode: 'ADDITIONAL-EXPENSE', action: 'UPDATE' },
      { menuCode: 'ORDER-STATUS', action: 'UPDATE' },
    ],
  })
  @httpGet('/:id', ParamValidation(DetailDto), RoleController.roleLogging.view)
  async byId(@requestParam('id') id: any) {
    return await this.queryService.byId(id);
  }

  /**
   * @swagger
   * /v1/roles/{id}:
   *   put:
   *     summary: Update role by ID
   *     tags: [Roles]
   *     security:
   *       - bearerAuth: []
   *       - api_key: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Role ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateDtoRoles'
   *     responses:
   *       200:
   *         description: Role updated successfully
   *       400:
   *         description: Invalid request payload
   *       404:
   *         description: Role not found
   *       401:
   *         description: Unauthorized
   */

  @ValidatePermissions({ menuCode: 'ROLE', action: 'UPDATE' })
  @httpPut(
    '/:id',
    ParamValidation(DetailDto),
    BodyValidation(UpdateDto),
    RoleController.roleLogging.update,
  )
  async update(@requestParam('id') id: any, @request() req: any) {
    return await this.commandService.update(id, req);
  }

  /**
   * @swagger
   * /v1/roles/{id}:
   *   delete:
   *     summary: Delete role by ID
   *     tags: [Roles]
   *     security:
   *       - bearerAuth: []
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
   *         description: Role deleted successfully
   *       404:
   *         description: Role not found
   *       401:
   *         description: Unauthorized
   */

  @ValidatePermissions({ menuCode: 'ROLE', action: 'DELETE' })
  @httpDelete(
    '/:id',
    ParamValidation(DetailDto),
    RoleController.roleLogging.delete,
  )
  async delete(@requestParam('id') id: any, @request() req: any) {
    return await this.commandService.delete(id, req);
  }
}
