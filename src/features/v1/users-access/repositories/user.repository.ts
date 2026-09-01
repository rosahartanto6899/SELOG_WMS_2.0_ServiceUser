import { Op } from 'sequelize';
import { User, UserRole } from '@/database/entities';
import { UserAttributes } from '@/database/attributes';

export class UserRepository {
  private readonly filterDeleted = { deletedAt: { [Op.is]: null } };

  public async getUsersByRoleId(roleId: string): Promise<UserAttributes[]> {
    const users = await User.findAll({
      where: this.filterDeleted,
      include: [
        {
          model: UserRole,
          as: 'userRoles',
          where: { roleId, ...this.filterDeleted },
        },
      ],
    });

    return users ? users.map((user) => user.get()) : [];
  }
}
