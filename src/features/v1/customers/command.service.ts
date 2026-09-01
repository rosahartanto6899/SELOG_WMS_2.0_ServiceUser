import { injectable, inject } from 'inversify';
import { BadRequestException } from '@/shared-libs/exceptions';
import { HTTP_STATUS } from '@/shared-libs/constants/http-status.constant';
import { Op } from 'sequelize';
import { CustomerRepository } from './repositories';
import { WarehouseRepository } from '@/features/v1/warehouses/repositories';

@injectable()
export class CommandService {
  constructor(
    @inject(CustomerRepository)
    private readonly customerRepository: CustomerRepository,
    @inject(WarehouseRepository)
    private readonly warehouseRepository: WarehouseRepository
  ) {}

  async create(req: any) {
    const user = req.user;
    const body = req.body;
    const dup = await this.customerRepository.getOneByConditions({
      code: body.code,
    });
    if (dup) throw new BadRequestException('Customer code already exists');
    await this.customerRepository.create({
      ...body,
      createdBy: user.tokenEmail,
    });
    return { data: null, httpCode: HTTP_STATUS.CREATED };
  }

  async update(id: string, req: any) {
    const user = req.user;
    const body = req.body;
    const found = await this.customerRepository.getOneByConditions({ id });
    if (!found) throw new BadRequestException('data not found');
    if (body.code) {
      const dup = await this.customerRepository.getOneByConditions({
        code: body.code,
        id: { [Op.ne]: id },
      });
      if (dup) throw new BadRequestException('Customer code already exists');
    }
    await this.customerRepository.update(
      { id },
      { ...body, updatedBy: user.tokenEmail }
    );
    return { data: null, httpCode: HTTP_STATUS.OK };
  }

  async delete(id: string, req: any) {
    const user = req.user;
    const found = await this.customerRepository.getOneByConditions({ id });
    if (!found) throw new BadRequestException('data not found');
    const inUse = await this.warehouseRepository.getAllWithPagination(
      {},
      { page: 1, limit: 1, order: 'createdAt', sort: 'asc' },
      id
    );
    if (inUse.pagination.totalData > 0) {
      throw new BadRequestException(
        'Customer still has warehouses; delete them first'
      );
    }
    await this.customerRepository.softDelete({ id }, user.tokenEmail);
    return { data: null, httpCode: HTTP_STATUS.OK };
  }
}
