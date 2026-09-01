import { Role } from '@/database/entities';
import { Op, Transaction } from 'sequelize';

export class RoleRepository {
  private filterDeleted = { deletedAt: { [Op.is]: null } };

  public async findById(id: string, transaction?: Transaction): Promise<any> {
    try {
      const conditions = { id: id, ...this.filterDeleted };
      const role = await Role.findOne({ where: conditions, transaction });
      return role;
    } catch (error) {
      throw error;
    }
  }

  public async findAll(transaction?: Transaction): Promise<any[]> {
    try {
      const conditions = { ...this.filterDeleted };
      const roles = await Role.findAll({ where: conditions, transaction });
      return roles;
    } catch (error: any) {
      throw error;
    }
  }
}
