import { UserRole } from '@/database/entities';
import { Op, Transaction } from 'sequelize';

export class UserRoleRepository {
  private filterDeleted = { deletedAt: { [Op.is]: null } };

  public async getByCondition(
    conditions: any,
    transaction?: Transaction
  ): Promise<any> {
    try {
      const role = await UserRole.findOne({
        where: { ...conditions, ...this.filterDeleted },
        transaction,
      });
      return role;
    } catch (error) {
      throw error;
    }
  }
}
