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
import { CreateCustomerDto, UpdateCustomerDto, DetailDto, ListDto } from './dtos';
import { CommandService } from './command.service';
import { QueryService } from './query.service';

/**
 * @swagger
 * tags:
 *   - name: Customers
 *     description: Customer (tenant) management endpoints
 */
@controller('/v1/customers')
export class CustomerController extends BaseHttpController {
  private static readonly customerLogging = ControllerLogging.forEntity(
    'customers',
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
   * /v1/customers:
   *   get:
   *     summary: Get all customers (paginated)
   *     tags: [Customers]
   *     security: [{ bearerAuth: [] }, { api_key: [] }]
   *     responses:
   *       200: { description: Customer list }
   */
  @httpGet('/', QueryValidation(ListDto), CustomerController.customerLogging.list)
  async getAll(@request() req: any) {
    return await this.queryService.getAll(req);
  }

  /**
   * @swagger
   * /v1/customers/{id}:
   *   get:
   *     summary: Get customer detail incl. warehouses
   *     tags: [Customers]
   *     security: [{ bearerAuth: [] }, { api_key: [] }]
   *     responses:
   *       200: { description: Customer detail }
   */
  @httpGet(
    '/:id',
    ParamValidation(DetailDto),
    CustomerController.customerLogging.custom('view-customers-detail')
  )
  async byId(@requestParam('id') id: string) {
    return await this.queryService.byId(id);
  }

  /**
   * @swagger
   * /v1/customers:
   *   post:
   *     summary: Create customer
   *     tags: [Customers]
   *     security: [{ bearerAuth: [] }, { api_key: [] }]
   *     responses:
   *       201: { description: Created }
   */
  @httpPost(
    '/',
    BodyValidation(CreateCustomerDto),
    CustomerController.customerLogging.custom('create-customers')
  )
  async create(@request() req: any) {
    return await this.commandService.create(req);
  }

  /**
   * @swagger
   * /v1/customers/{id}:
   *   put:
   *     summary: Update customer
   *     tags: [Customers]
   *     security: [{ bearerAuth: [] }, { api_key: [] }]
   *     responses:
   *       200: { description: Updated }
   */
  @httpPut(
    '/:id',
    ParamValidation(DetailDto),
    BodyValidation(UpdateCustomerDto),
    CustomerController.customerLogging.custom('update-customers')
  )
  async update(@requestParam('id') id: string, @request() req: any) {
    return await this.commandService.update(id, req);
  }

  /**
   * @swagger
   * /v1/customers/{id}:
   *   delete:
   *     summary: Soft delete customer
   *     tags: [Customers]
   *     security: [{ bearerAuth: [] }, { api_key: [] }]
   *     responses:
   *       200: { description: Deleted }
   */
  @httpDelete(
    '/:id',
    ParamValidation(DetailDto),
    CustomerController.customerLogging.custom('delete-customers')
  )
  async delete(@requestParam('id') id: string, @request() req: any) {
    return await this.commandService.delete(id, req);
  }
}
