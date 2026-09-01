import { UserRoleWarehouseAttributes } from '@/database/attributes';
import { UserRoleWarehouse } from '@/database/entities';
import { Transaction } from 'sequelize';

export class UserRoleWarehouseRepository {
  public async create(
    data: UserRoleWarehouseAttributes,
    transaction?: Transaction
  ): Promise<UserRoleWarehouseAttributes> {
    const userRoleWarehouse = await UserRoleWarehouse.create(data, {
      transaction,
    });
    return userRoleWarehouse.get() as UserRoleWarehouseAttributes;
  }

  public async createBulk(
    data: UserRoleWarehouseAttributes[],
    transaction?: Transaction
  ): Promise<any> {
    return UserRoleWarehouse.bulkCreate(data, { transaction });
  }

  public async deleteByConditions(
    conditions: any,
    transaction?: Transaction
  ): Promise<void> {
    await UserRoleWarehouse.destroy({
      where: { ...conditions },
      transaction,
    });
  }
}
