import { LoginHistory } from '@/database/entities';
import { LoginHistoryAttributes } from '@/database/attributes';
import { Transaction } from 'sequelize';

export class LoginHistoryRepository {
  public async create(
    payload: LoginHistoryAttributes,
    transaction?: Transaction
  ): Promise<any> {
    try {
      const loginHistory = await LoginHistory.create(payload, { transaction });
      return loginHistory;
    } catch (error: any) {
      throw error;
    }
  }
}
