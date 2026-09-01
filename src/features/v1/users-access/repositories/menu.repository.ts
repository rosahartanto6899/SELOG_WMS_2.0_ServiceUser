import { MenuAttributes } from '@/database/attributes';
import { Menu, Uam, Role } from '@/database/entities';
import { Op, Transaction } from 'sequelize';

export class MenuRepository {
  private readonly filterDeleted = { deletedAt: { [Op.is]: null } };

  public async getOneByCondition(
    condition: any,
    transaction?: Transaction
  ): Promise<MenuAttributes | null> {
    const menu = await Menu.findOne({
      where: { ...condition, ...this.filterDeleted },
      transaction,
    });
    return menu ? menu.get() : null;
  }

  /**
   * Get all menus with UAM records for a specific role
   */
  public async getMenusWithUAMByRole(
    roleId: string,
    transaction?: Transaction
  ): Promise<any[]> {
    try {
      const menus = await Menu.findAll({
        where: this.filterDeleted,
        include: [
          {
            model: Uam,
            as: 'uams',
            where: {
              roleId,
              ...this.filterDeleted,
            },
            include: [
              {
                model: Role,
                as: 'role',
                where: this.filterDeleted,
              },
            ],
          },
        ],
        transaction,
      });
      return menus.map((menu) => menu.get());
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Get menus by parent IDs
   */
  public async getMenusByParentIds(
    parentIds: string[],
    transaction?: Transaction
  ): Promise<MenuAttributes[]> {
    try {
      if (parentIds.length === 0) return [];

      const menus = await Menu.findAll({
        where: {
          id: { [Op.in]: parentIds },
          ...this.filterDeleted,
        },
        transaction,
      });
      return menus.map((menu) => menu.get());
    } catch (error: any) {
      throw error;
    }
  }
}
