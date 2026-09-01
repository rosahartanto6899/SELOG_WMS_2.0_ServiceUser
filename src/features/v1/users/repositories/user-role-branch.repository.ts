import { UserRoleBranchAttributes } from '@/database/attributes';
import { UserRoleBranch } from '@/database/entities';
import { Transaction } from 'sequelize';

export class UserRoleBranchRepository {
  public async create(
    data: UserRoleBranchAttributes,
    transaction?: Transaction
  ): Promise<UserRoleBranchAttributes> {
    const userRole = await UserRoleBranch.create(data, { transaction });
    return userRole.get() as UserRoleBranchAttributes;
  }

  public async createBulk(
    data: UserRoleBranchAttributes[],
    transaction?: Transaction
  ): Promise<any> {
    const userRoleBranches = await UserRoleBranch.bulkCreate(data, {
      transaction,
    });
    return userRoleBranches;
  }

  public async deleteByConditions(
    conditions: any,
    transaction?: Transaction
  ): Promise<void> {
    await UserRoleBranch.destroy({
      where: {
        ...conditions,
      },
      transaction,
    });
  }
}
