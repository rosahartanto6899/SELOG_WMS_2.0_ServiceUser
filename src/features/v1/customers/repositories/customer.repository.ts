import { CustomerAttributes } from '@/database/attributes';
import { Customer } from '@/database/entities';
import { Transaction } from 'sequelize';

export class CustomerRepository {
  private filterDeleted = { deletedAt: null };

  public async create(
    data: CustomerAttributes,
    transaction?: Transaction
  ): Promise<any> {
    return await Customer.create(data, { transaction });
  }

  public async getOneByConditions(condition: any, transaction?: Transaction) {
    return await Customer.findOne({
      where: { ...condition, ...this.filterDeleted },
      transaction,
    });
  }

  public async getAllWithPagination(condition: any, pagination: any) {
    const { page, limit, order, sort } = pagination;
    const { count, rows } = await Customer.findAndCountAll({
      where: { ...this.filterDeleted, ...condition },
      offset: (page - 1) * limit,
      limit,
      order: [[order, sort]],
    });
    return {
      data: rows,
      pagination: {
        page,
        limit,
        totalData: count,
        totalPage: Math.ceil(count / limit),
      },
    };
  }

  public async update(condition: any, data: any, transaction?: Transaction) {
    return await Customer.update(data, {
      where: { ...condition, ...this.filterDeleted },
      transaction,
    });
  }

  public async softDelete(
    condition: any,
    deletedBy: string,
    transaction?: Transaction
  ) {
    return await Customer.update(
      { deletedAt: new Date(), deletedBy },
      { where: { ...condition, ...this.filterDeleted }, transaction }
    );
  }
}
