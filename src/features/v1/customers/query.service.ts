import { injectable, inject } from 'inversify';
import { BadRequestException } from '@/shared-libs/exceptions';
import { HTTP_STATUS } from '@/shared-libs/constants/http-status.constant';
import { Op } from 'sequelize';
import { Pagination } from '@/shared-libs/helpers/pagination.helper';
import { CustomerRepository } from './repositories';
import { WarehouseRepository } from '@/features/v1/warehouses/repositories';

@injectable()
export class QueryService {
  constructor(
    @inject(CustomerRepository)
    private readonly customerRepository: CustomerRepository,
    @inject(WarehouseRepository)
    private readonly warehouseRepository: WarehouseRepository
  ) {}

  async byId(id: string) {
    const customer = await this.customerRepository.getOneByConditions({ id });
    if (!customer) throw new BadRequestException('data not found');
    const plain = customer.get({ plain: true });
    const warehouses = await this.warehouseRepository.getAllWithPagination(
      {},
      { page: 1, limit: 100, order: 'name', sort: 'asc' },
      id
    );
    return {
      data: { ...plain, warehouses: warehouses.data },
      httpCode: HTTP_STATUS.OK,
    };
  }

  async getAll(req: any) {
    const param = req.query;
    const where: any = {};
    if (param.search && param.searchBy) {
      where[param.searchBy] = { [Op.like]: `%${param.search}%` };
    }
    const order = param.order ?? 'createdAt';
    const sort = param.sort ?? 'asc';
    const { page, limit, offset } = Pagination.getPagination(
      parseInt(param.page ?? '1', 10),
      parseInt(param.limit ?? '10', 10)
    );
    const { data, pagination } =
      await this.customerRepository.getAllWithPagination(where, {
        page,
        limit,
        offset,
        order,
        sort,
      });
    return { data, page: pagination, httpCode: HTTP_STATUS.OK };
  }
}
