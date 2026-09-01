import { MenuAttributes } from '@/database/attributes';
import { Menu } from '@/database/entities';
import { Op, Transaction } from 'sequelize';

export class MenuRepository {
  private filterDeleted = { deletedAt: { [Op.is]: null } };

  public async getOneByCondition(
    condition: any,
    transaction?: Transaction
  ): Promise<any> {
    try {
      const menu = await Menu.findOne({
        where: [condition, this.filterDeleted],
        transaction,
        include: [
          {
            model: Menu,
            as: 'children',
            required: false,
            where: this.filterDeleted,
          },
          {
            model: Menu,
            as: 'parent',
            required: false,
            where: this.filterDeleted,
          },
        ],
      });
      return menu;
    } catch (error: any) {
      throw error;
    }
  }

  public async getAllWithPagination(
    condition: any,
    pagination: any
  ): Promise<any> {
    try {
      const { page, limit, order, sort } = pagination;

      const conditions = { ...this.filterDeleted, ...condition };
      const { count, rows } = await Menu.findAndCountAll({
        where: conditions,
        offset: (page - 1) * limit,
        limit,
        order: [[order, sort]],
        include: [
          {
            model: Menu,
            as: 'children',
            required: false,
            separate: true,
            where: this.filterDeleted,
          },
          {
            model: Menu,
            as: 'parent',
            required: false,
            where: this.filterDeleted,
          },
        ],
      });

      const data = {
        data: rows,
        pagination: {
          page,
          limit,
          totalData: count,
          totalPage: Math.ceil(count / limit),
        },
      };
      return data;
    } catch (error: any) {
      throw error;
    }
  }

  public async getAllByCondition(
    condition: any,
    order: any,
    transaction?: Transaction
  ): Promise<any> {
    try {
      const conditions = [this.filterDeleted, ...condition];
      const menus = await Menu.findAll({
        where: conditions,
        order: [[order.order, order.sort]],
        transaction,
        include: [
          {
            model: Menu,
            as: 'children',
            required: false,
            where: this.filterDeleted,
          },
          {
            model: Menu,
            as: 'parent',
            required: false,
            where: this.filterDeleted,
          },
        ],
      });
      return menus;
    } catch (error: any) {
      throw error;
    }
  }

  public async count(condition: any, transaction?: Transaction): Promise<any> {
    try {
      const conditions = { ...this.filterDeleted, ...condition };
      const menu = await Menu.count({ where: conditions, transaction });
      return menu;
    } catch (error: any) {
      throw error;
    }
  }

  public async create(
    data: MenuAttributes,
    transaction?: Transaction
  ): Promise<any> {
    try {
      const menu = await Menu.create(data, { transaction, returning: true });
      return menu;
    } catch (error: any) {
      throw error;
    }
  }

  public async update(
    id: string,
    data: MenuAttributes,
    transaction?: Transaction
  ): Promise<any> {
    try {
      const conditions = { ...this.filterDeleted, id };
      const menu = await Menu.update(data, { where: conditions, transaction });
      return menu;
    } catch (error: any) {
      throw error;
    }
  }

  public async deleteByConditions(
    conditions: any,
    userId: string,
    transaction?: Transaction
  ): Promise<any> {
    try {
      const menu = await Menu.update(
        {
          deletedAt: new Date(),
          deletedBy: userId,
        },
        {
          where: conditions,
          transaction,
        }
      );
      return menu;
    } catch (error: any) {
      throw error;
    }
  }

  // Get leaf menus for dropdown (no pagination, only essential fields)
  public async getLeafMenusForDropdown(
    condition: any = {},
    transaction?: Transaction
  ): Promise<any> {
    try {
      const conditions = { ...this.filterDeleted, ...condition };

      const menus = await Menu.findAll({
        where: conditions,
        attributes: ['id', 'menu', 'menuCode', 'level', 'parentId', 'order'],
        include: [
          {
            model: Menu,
            as: 'children',
            required: false,
            where: this.filterDeleted,
            attributes: ['id'], // Only need id to check if children exist
          },
          {
            model: Menu,
            as: 'parent',
            required: false,
            where: this.filterDeleted,
            attributes: ['id', 'menu'], // Include parent info for context
          },
        ],
        order: [
          ['level', 'ASC'],
          ['order', 'ASC'],
        ],
        transaction,
      });

      // Filter out menus that have children and format for dropdown
      const leafMenus = menus
        .filter((menu: any) => !menu.children || menu.children.length === 0)
        .map((menu: any) => ({
          value: menu.id,
          label: menu.menu,
          code: menu.menuCode,
          level: menu.level,
          parentId: menu.parentId,
          parentName: menu.parent?.menu || null,
        }));

      return leafMenus;
    } catch (error: any) {
      throw error;
    }
  }
}
