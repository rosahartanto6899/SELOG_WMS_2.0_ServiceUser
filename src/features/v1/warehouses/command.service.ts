import { injectable, inject } from 'inversify';
import { BadRequestException } from '@/shared-libs/exceptions';
import { HTTP_STATUS } from '@/shared-libs/constants/http-status.constant';
import { Op } from 'sequelize';
import { CustomerRepository } from '@/features/v1/customers/repositories';
import { WarehouseRepository } from './repositories';

@injectable()
export class CommandService {
  constructor(
    @inject(WarehouseRepository)
    private readonly warehouseRepository: WarehouseRepository,
    @inject(CustomerRepository)
    private readonly customerRepository: CustomerRepository
  ) {}

  async create(req: any) {
    const user = req.user;
    const body = req.body;
    const customer = await this.customerRepository.getOneByConditions({
      id: body.customerId,
    });
    if (!customer) throw new BadRequestException('Customer not found');
    const dup = await this.warehouseRepository.getOneByConditions({
      code: body.code,
    });
    if (dup) throw new BadRequestException('Warehouse code already exists');
    await this.warehouseRepository.create({
      ...body,
      createdBy: user.tokenEmail,
    });
    return { data: null, httpCode: HTTP_STATUS.CREATED };
  }

  async update(id: string, req: any) {
    const user = req.user;
    const body = req.body;
    const found = await this.warehouseRepository.getOneByConditions({ id });
    if (!found) throw new BadRequestException('data not found');
    if (body.code) {
      const dup = await this.warehouseRepository.getOneByConditions({
        code: body.code,
        id: { [Op.ne]: id },
      });
      if (dup) throw new BadRequestException('Warehouse code already exists');
    }
    await this.warehouseRepository.update(
      { id },
      { ...body, updatedBy: user.tokenEmail }
    );
    return { data: null, httpCode: HTTP_STATUS.OK };
  }

  async delete(id: string, req: any) {
    const user = req.user;
    const found = await this.warehouseRepository.getOneByConditions({ id });
    if (!found) throw new BadRequestException('data not found');
    await this.warehouseRepository.softDelete({ id }, user.tokenEmail);
    return { data: null, httpCode: HTTP_STATUS.OK };
  }
}
