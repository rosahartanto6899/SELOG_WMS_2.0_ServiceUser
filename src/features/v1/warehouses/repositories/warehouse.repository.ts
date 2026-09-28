import { WarehouseAttributes } from '@/database/attributes';
import { Warehouse } from '@/database/entities';
import { Transaction } from 'sequelize';

export class WarehouseRepository {
  private filterDeleted = { deletedAt: null };

  public async create(
    data: WarehouseAttributes,
    transaction?: Transaction
  ): Promise<any> {
    return await Warehouse.create(data, { transaction });
  }

  public async getOneByConditions(condition: any, transaction?: Transaction) {
    return await Warehouse.findOne({
      where: { ...condition, ...this.filterDeleted },
      transaction,
    });
  }

  /** List {code, name} semua warehouse aktif — m2m service-to-service. */
  public async getAllInternal(): Promise<{ code: string; name: string | null }[]> {
    const rows = await Warehouse.findAll({
      attributes: ['code', 'name'],
      where: { ...this.filterDeleted },
      order: [['code', 'ASC']],
      raw: true,
    });
    return rows as unknown as { code: string; name: string | null }[];
  }

  public async getAllWithPagination(
    condition: any,
    pagination: any,
    customerId?: string
  ) {
    const { page, limit, order, sort } = pagination;
    const include = [{ association: 'customer', attributes: ['id', 'name', 'code'] }];
    const where: any = {
      ...this.filterDeleted,
      ...condition,
      ...(customerId ? { customerId } : {}),
    };
    const { count, rows } = await Warehouse.findAndCountAll({
      where,
      include,
      offset: (page - 1) * limit,
      limit,
      order: [[order, sort]],
      distinct: true,
      col: 'ID', // kolom fisik "ID" (quoted); attribute map id→ID
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
    return await Warehouse.update(data, {
      where: { ...condition, ...this.filterDeleted },
      transaction,
    });
  }

  public async softDelete(
    condition: any,
    deletedBy: string,
    transaction?: Transaction
  ) {
    return await Warehouse.update(
      { deletedAt: new Date(), deletedBy },
      { where: { ...condition, ...this.filterDeleted }, transaction }
    );
  }
}
