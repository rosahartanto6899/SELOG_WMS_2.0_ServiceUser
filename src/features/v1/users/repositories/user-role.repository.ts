import { UserRoleAttributes } from '@/database/attributes';
import { UserRole } from '@/database/entities';
import { Transaction } from 'sequelize';

export class UserRoleRepository {
  public async create(
    data: UserRoleAttributes,
    transaction?: Transaction
  ): Promise<UserRoleAttributes> {
    const userRole = await UserRole.create(data, { transaction });
    return userRole.get() as UserRoleAttributes;
  }

  public async deleteByConditions(
    conditions: any,
    transaction?: Transaction
  ): Promise<void> {
    await UserRole.destroy({
      where: conditions,
      transaction,
    });
  }
}
