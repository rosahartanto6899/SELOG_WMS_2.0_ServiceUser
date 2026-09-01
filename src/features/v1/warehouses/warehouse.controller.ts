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
import {
  CreateWarehouseDto,
  UpdateWarehouseDto,
  DetailDto,
  ListDto,
} from './dtos';
import { CommandService } from './command.service';
import { QueryService } from './query.service';

/**
 * @swagger
 * tags:
 *   - name: Warehouses
 *     description: Warehouse management endpoints
 */
@controller('/v1/warehouses')
export class WarehouseController extends BaseHttpController {
  private static readonly warehouseLogging = ControllerLogging.forEntity(
    'warehouses',
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
   * /v1/warehouses:
   *   get:
   *     summary: Get all warehouses (paginated)
   *     tags: [Warehouses]
   *     security: [{ bearerAuth: [] }, { api_key: [] }]
   *     responses:
   *       200: { description: Warehouse list }
   */
  @httpGet(
    '/',
    QueryValidation(ListDto),
    WarehouseController.warehouseLogging.list
  )
  async getAll(@request() req: any) {
    return await this.queryService.getAll(req);
  }

  /**
   * @swagger
   * /v1/warehouses/dropdown:
   *   get:
   *     summary: Dropdown warehouses with customer
   *     tags: [Warehouses]
   *     security: [{ bearerAuth: [] }, { api_key: [] }]
   *     responses:
   *       200: { description: Warehouse dropdown }
   */
  @httpGet('/dropdown')
  async dropdown() {
    return await this.queryService.dropdown();
  }

  /**
   * @swagger
   * /v1/warehouses/customers:
   *   get:
   *     summary: Customer list
   *     tags: [Warehouses]
   *     security: [{ bearerAuth: [] }, { api_key: [] }]
   *     responses:
   *       200: { description: Customers }
   */
  @httpGet('/customers')
  async customers() {
    return await this.queryService.customers();
  }

  /**
   * @swagger
   * /v1/warehouses/{id}:
   *   get:
   *     summary: Warehouse detail
   *     tags: [Warehouses]
   *     security: [{ bearerAuth: [] }, { api_key: [] }]
   *     responses:
   *       200: { description: Warehouse detail }
   */
  @httpGet(
    '/:id',
    ParamValidation(DetailDto),
    WarehouseController.warehouseLogging.custom('view-warehouses-detail')
  )
  async byId(@requestParam('id') id: string) {
    return await this.queryService.byId(id);
  }

  /**
   * @swagger
   * /v1/warehouses:
   *   post:
   *     summary: Create warehouse
   *     tags: [Warehouses]
   *     security: [{ bearerAuth: [] }, { api_key: [] }]
   *     responses:
   *       201: { description: Created }
   */
  @httpPost(
    '/',
    BodyValidation(CreateWarehouseDto),
    WarehouseController.warehouseLogging.custom('create-warehouses')
  )
  async create(@request() req: any) {
    return await this.commandService.create(req);
  }

  /**
   * @swagger
   * /v1/warehouses/{id}:
   *   put:
   *     summary: Update warehouse
   *     tags: [Warehouses]
   *     security: [{ bearerAuth: [] }, { api_key: [] }]
   *     responses:
   *       200: { description: Updated }
   */
  @httpPut(
    '/:id',
    ParamValidation(DetailDto),
    BodyValidation(UpdateWarehouseDto),
    WarehouseController.warehouseLogging.custom('update-warehouses')
  )
  async update(@requestParam('id') id: string, @request() req: any) {
    return await this.commandService.update(id, req);
  }

  /**
   * @swagger
   * /v1/warehouses/{id}:
   *   delete:
   *     summary: Soft delete warehouse
   *     tags: [Warehouses]
   *     security: [{ bearerAuth: [] }, { api_key: [] }]
   *     responses:
   *       200: { description: Deleted }
   */
  @httpDelete(
    '/:id',
    ParamValidation(DetailDto),
    WarehouseController.warehouseLogging.custom('delete-warehouses')
  )
  async delete(@requestParam('id') id: string, @request() req: any) {
    await this.commandService.delete(id, req);
  }
}
