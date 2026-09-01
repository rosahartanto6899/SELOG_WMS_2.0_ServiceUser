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
        where: condition,
        transaction,
        include: ['children', 'parent'],
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
        include: ['children', 'parent'],
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
      const conditions = { ...this.filterDeleted, ...condition };
      const menus = await Menu.findAll({
        where: conditions,
        order: [[order.order, order.sort]],
        transaction,
        include: ['children', 'parent'],
      });
      return menus;
    } catch (error: any) {
      throw error;
    }
  }

  public async getAll(transaction?: Transaction): Promise<any[]> {
    try {
      const conditions = { ...this.filterDeleted };
      const roles = await Menu.findAll({ where: conditions, transaction });
      return roles;
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
    transaction?: Transaction
  ): Promise<any> {
    try {
      const menu = await Menu.destroy({ where: conditions, transaction });
      return menu;
    } catch (error: any) {
      throw error;
    }
  }
}
