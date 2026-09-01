import { injectable, inject } from 'inversify';
import { BadRequestException } from '@/shared-libs/exceptions';
import { HTTP_STATUS } from '@/shared-libs/constants/http-status.constant';
import { Op } from 'sequelize';
import { Pagination } from '@/shared-libs/helpers/pagination.helper';
import { WarehouseRepository } from './repositories';

@injectable()
export class QueryService {
  constructor(
    @inject(WarehouseRepository)
    private readonly warehouseRepository: WarehouseRepository
  ) {}

  async byId(id: string) {
    const warehouse = await this.warehouseRepository.getOneByConditions({ id });
    if (!warehouse) throw new BadRequestException('data not found');
    return { data: warehouse, httpCode: HTTP_STATUS.OK };
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
      await this.warehouseRepository.getAllWithPagination(where, {
        page,
        limit,
        offset,
        order,
        sort,
      });
    return { data, page: pagination, httpCode: HTTP_STATUS.OK };
  }

  async dropdown(): Promise<any> {
    const { data } = await this.warehouseRepository.getAllWithPagination(
      {},
      { page: 1, limit: 500, order: 'name', sort: 'asc' }
    );
    const list = (data as any[]).map((w: any) => {
      const p = w.get ? w.get({ plain: true }) : w;
      return {
        id: p.id,
        code: p.code,
        name: p.name,
        customer: p.customer || null,
      };
    });
    return { data: list, httpCode: HTTP_STATUS.OK };
  }

  async customers(): Promise<any> {
    const { Customer } = await import('@/database/entities');
    const customers = await Customer.findAll({
      attributes: ['id', 'code', 'name'],
      order: [['name', 'ASC']],
    });
    return {
      data: customers.map((c: any) => c.get({ plain: true })),
      httpCode: HTTP_STATUS.OK,
    };
  }
}
