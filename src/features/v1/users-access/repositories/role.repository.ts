import { RoleAttributes } from '@/database/attributes';
import { Role } from '@/database/entities';
import { Transaction } from 'sequelize';

export class RoleRepository {
  private filterDeleted = { deletedAt: null };
  public async create(
    data: RoleAttributes,
    transaction?: Transaction
  ): Promise<any> {
    try {
      const role = await Role.create(data, { transaction });
      return role;
    } catch (error) {
      throw error;
    }
  }

  public async deleteByConditions(
    condition: any,
    userId: string,
    transaction?: Transaction
  ): Promise<any> {
    try {
      const role = await Role.update(
        {
          deletedAt: new Date(),
          deletedBy: userId,
        },
        {
          where: { ...condition },
          transaction,
        }
      );
      return role;
    } catch (error) {
      throw error;
    }
  }

  public async getOneByConditions(
    condition: any,
    transaction?: Transaction
  ): Promise<any> {
    try {
      const role = await Role.findOne({
        where: { ...condition, ...this.filterDeleted },
        transaction,
      });
      return role;
    } catch (error) {
      throw error;
    }
  }

  public async getAllByConditions(
    condition: any,
    order: any,
    transaction?: Transaction
  ): Promise<any> {
    try {
      const roles = await Role.findAll({
        where: { ...condition, ...this.filterDeleted },
        order: [[order.order, order.sort]],
        transaction,
      });
      return roles;
    } catch (error) {
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
      const { count, rows } = await Role.findAndCountAll({
        where: conditions,
        offset: (page - 1) * limit,
        limit,
        order: [[order, sort]],
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

  public async update(
    condition: any,
    data: any,
    transaction?: Transaction
  ): Promise<any> {
    try {
      const role = await Role.update(data, {
        where: { ...condition, ...this.filterDeleted },
        transaction,
      });
      return role;
    } catch (error) {
      throw error;
    }
  }
}
