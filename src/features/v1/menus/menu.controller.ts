import {
  BaseHttpController,
  controller,
  httpGet,
  request,
  requestParam,
  httpPost,
  httpPut,
  httpDelete,
} from 'inversify-express-utils';
import { inject } from 'inversify';
import {
  BodyValidation,
  ParamValidation,
  QueryValidation,
} from '@/shared-libs/base';
import { ControllerLogging } from '@/shared-libs/helpers/logging.helper';
import { ValidatePermissions } from '@/shared-libs/decorators/permission-interceptor.decorator';
import { CommandService } from './command.service';
import { UpdateDto, CreateDto, DetailDto, ListDto } from './dtos';
import { QueryService } from './query.service';
import { MICROSERVICE_IDENTIFIERS } from '@/shared-libs';

/**
 * @swagger
 * tags:
 *   - name: Menus
 *     description: API menu manajement
 */

@controller('/v1/menus')
export class MenuController extends BaseHttpController {
  private static readonly menuLogging = ControllerLogging.forEntity(
    'menus',
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
   * /v1/menus:
   *   get:
   *     summary: Get all menus
   *     tags: [Menus]
   *     security:
   *       - bearerAuth: []
   *       - api_key: []
   *     responses:
   *       200:
   *         description: List of menus
   */
  @httpGet('/', QueryValidation(ListDto), MenuController.menuLogging.list)
  async getAll(@request() req: any) {
    return await this.queryService.getAll(req);
  }

  /**
   * @swagger
   * /v1/menus:
   *   post:
   *     summary: Create a new menu
   *     tags: [Menus]
   *     security:
   *       - bearerAuth: []
   *       - api_key: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateDtoMenu'
   *     responses:
   *       201:
   *         description: Menu created successfully
   */
  @ValidatePermissions({ menuCode: 'MENU', action: 'CREATE' })
  @httpPost('/', BodyValidation(CreateDto), MenuController.menuLogging.create)
  async create(@request() req: any) {
    return await this.commandService.create(req);
  }

  /**
   * @swagger
   * /v1/menus/dropdown:
   *   get:
   *     summary: Get menus for dropdown
   *     tags: [Menus]
   *     security:
   *       - bearerAuth: []
   *       - api_key: []
   *     responses:
   *       200:
   *         description: Dropdown menu list
   */
  @ValidatePermissions({ menuCode: 'MENU', action: 'READ' })
  @httpGet('/dropdown', MenuController.menuLogging.dropdown)
  async dropdown(@request() req: any) {
    return await this.queryService.dropdown(req);
  }

  /**
   * @swagger
   * /v1/menus/parent-dropdown:
   *   get:
   *     summary: Get parent menus for dropdown
   *     tags: [Menus]
   *     security:
   *       - bearerAuth: []
   *       - api_key: []
   *     responses:
   *       200:
   *         description: Parent dropdown menu list
   */
  @ValidatePermissions({ menuCode: 'MENU', action: 'READ' })
  @httpGet(
    '/parent-dropdown',
    MenuController.menuLogging.custom('get-parent-menu-dropdown'),
  )
  async parentDropdown(@request() req: any) {
    return await this.queryService.parentDropdown(req);
  }

  /**
   * @swagger
   * /v1/menus/leaf-dropdown:
   *   get:
   *     summary: Get leaf menus for dropdown (menus without children)
   *     tags: [Menus]
   *     security:
   *       - bearerAuth: []
   *       - api_key: []
   *     parameters:
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search query for menu name
   *       - in: query
   *         name: level
   *         schema:
   *           type: integer
   *         description: Filter by menu level
   *     responses:
   *       200:
   *         description: Leaf menus dropdown list
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       value:
   *                         type: string
   *                         description: Menu ID
   *                       label:
   *                         type: string
   *                         description: Menu name
   *                       code:
   *                         type: string
   *                         description: Menu code
   *                       level:
   *                         type: integer
   *                         description: Menu level
   *                       parentId:
   *                         type: string
   *                         description: Parent menu ID
   *                       parentName:
   *                         type: string
   *                         description: Parent menu name
   *                 httpCode:
   *                   type: integer
   */
  @ValidatePermissions({
    allowedMenuPermissions: [
      { menuCode: 'MENU', action: 'READ' },
      { menuCode: 'UAM', action: 'READ' },
      { menuCode: 'UAM', action: 'UPDATE' },
      { menuCode: 'UAM', action: 'CREATE' },
    ],
  })
  @httpGet(
    '/leaf-dropdown',
    MenuController.menuLogging.custom('get-leaf-menu-dropdown'),
  )
  async leafMenusDropdown(@request() req: any) {
    return await this.queryService.leafMenusDropdown(req);
  }

  /**
   * @swagger
   * /v1/menus/{id}:
   *   get:
   *     summary: Get menu by ID
   *     tags: [Menus]
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
   *         description: Menu data
   */
  @ValidatePermissions({ menuCode: 'MENU', action: 'READ' })
  @httpGet('/:id', ParamValidation(DetailDto), MenuController.menuLogging.view)
  async byId(@requestParam('id') id: any) {
    return await this.queryService.byId(id);
  }

  /**
   * @swagger
   * /v1/menus/{id}:
   *   put:
   *     summary: Update menu by ID
   *     tags: [Menus]
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
   *             $ref: '#/components/schemas/UpdateDtoMenu'
   *     responses:
   *       200:
   *         description: Menu updated successfully
   */
  @ValidatePermissions({ menuCode: 'MENU', action: 'UPDATE' })
  @httpPut(
    '/:id',
    ParamValidation(DetailDto),
    BodyValidation(UpdateDto),
    MenuController.menuLogging.update,
  )
  async update(@requestParam('id') id: any, @request() req: any) {
    return await this.commandService.update(id, req);
  }

  /**
   * @swagger
   * /v1/menus/{id}:
   *   delete:
   *     summary: Delete menu by ID
   *     tags: [Menus]
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
   *         description: Menu deleted successfully
   */
  @ValidatePermissions({ menuCode: 'MENU', action: 'DELETE' })
  @httpDelete(
    '/:id',
    ParamValidation(DetailDto),
    MenuController.menuLogging.delete,
  )
  async delete(@requestParam('id') id: any, @request() req: any) {
    return await this.commandService.delete(id, req);
  }
}
