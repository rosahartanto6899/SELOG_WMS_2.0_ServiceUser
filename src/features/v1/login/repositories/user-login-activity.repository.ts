import { UserLoginActivity } from '@/database/entities';
import { UserLoginActivityAttributes } from '@/database/attributes';
import { Transaction } from 'sequelize';

export class UserLoginActivityRepository {
  public async create(
    payload: UserLoginActivityAttributes,
    transaction?: Transaction
  ): Promise<UserLoginActivityAttributes> {
    const userLoginActivity = await UserLoginActivity.create(payload, {
      transaction,
    });
    return userLoginActivity.get({ plain: true });
  }
}
