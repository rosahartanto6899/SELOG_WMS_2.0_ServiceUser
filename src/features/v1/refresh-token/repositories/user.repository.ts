import { Op } from 'sequelize';
import {
  Menu,
  Role,
  Uam,
  User,
  UserRole,
  UserRoleWarehouse,
  Warehouse,
} from '@/database/entities';

export class UserRepository {
  private filterDeleted = { deletedAt: { [Op.is]: null } };

  public async getById(id: string): Promise<any> {
    try {
      const conditions = { id, ...this.filterDeleted };
      const user = await User.findOne({
        where: conditions,
        include: [
          {
            model: UserRole,
            as: 'userRoles',
            include: [
              {
                model: Role,
                as: 'role',
              },
              {
                model: UserRoleWarehouse,
                as: 'warehouses',
                include: [
                  {
                    model: Warehouse,
                    as: 'warehouse',
                  },
                ],
              },
            ],
          },
        ],
      });

      return user;
    } catch (error) {
      throw error;
    }
  }

  public async getUserAccessibleMenusByRole(
    userId: string,
    roleId: string
  ): Promise<any> {
    // Query menus that user has access to through a specific role
    const accessibleMenus = await Menu.findAll({
      attributes: ['id', 'menuCode'],
      where: {
        deletedAt: { [Op.is]: null },
      },
      include: [
        {
          model: Uam,
          as: 'uams',
          attributes: [
            'canCreate',
            'canRead',
            'canUpdate',
            'canDelete',
            'canEtc',
          ],
          where: {
            deletedAt: { [Op.is]: null },
            canRead: true, // At least read permission is required
            roleId: roleId, // Filter by specific role
          },
          include: [
            {
              model: Role,
              as: 'role',
              attributes: ['id'],
              where: {
                deletedAt: { [Op.is]: null },
                id: roleId,
              },
              include: [
                {
                  model: UserRole,
                  as: 'userRoles',
                  attributes: ['id'],
                  where: {
                    userId: userId,
                    roleId: roleId,
                    deletedAt: { [Op.is]: null },
                  },
                },
              ],
            },
          ],
        },
      ],
      order: [
        ['level', 'ASC'],
        ['order', 'ASC'],
      ],
    });

    if (!accessibleMenus || accessibleMenus.length === 0) {
      return [];
    }

    // Process menus and collect permissions for the specific role
    const menuMap = new Map();

    accessibleMenus.forEach((menu: any) => {
      const menuId = menu.id;
      const menuData = menu.toJSON();

      // Get permissions from UAM for this specific role
      const uam = menu.uams?.[0]; // Should only have one UAM record for the specific role
      const permissions = {
        canCreate: uam?.canCreate || false,
        canRead: uam?.canRead || false,
        canUpdate: uam?.canUpdate || false,
        canDelete: uam?.canDelete || false,
        canEtc: uam?.canEtc || false,
      };

      menuMap.set(menuId, {
        id: menuData.id,
        menuCode: menuData.menuCode,
        permissions,
      });
    });

    // Build hierarchical structure
    const menuHierarchy: any[] = [];
    const processedMenus = Array.from(menuMap.values());

    // First, add all parent menus (level 1 or no parentId)
    processedMenus
      .filter((menu) => !menu.parentId)
      .sort((a, b) => a.order - b.order)
      .forEach((parentMenu) => {
        menuHierarchy.push(parentMenu);
      });

    // Then, add children to their respective parents
    processedMenus
      .filter((menu) => menu.parentId)
      .sort((a, b) => a.order - b.order)
      .forEach((childMenu) => {
        const parent = menuMap.get(childMenu.parentId);
        if (parent) {
          parent.children.push(childMenu);
        }
      });

    return menuHierarchy;
  }
}
