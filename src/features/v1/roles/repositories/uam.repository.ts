import { UamAttributes } from '@/database/attributes';
import { Uam } from '@/database/entities';
import { Transaction } from 'sequelize';

export class UamRepository {
  public async create(
    data: UamAttributes,
    transaction?: Transaction
  ): Promise<any> {
    try {
      const uam = await Uam.create(data, { transaction, returning: true });
      return uam;
    } catch (error: any) {
      throw error;
    }
  }

  public async createBulk(
    data: UamAttributes[],
    transaction?: Transaction
  ): Promise<any> {
    try {
      const uam = await Uam.bulkCreate(data, { transaction, returning: true });
      return uam;
    } catch (error: any) {
      throw error;
    }
  }
}
