import { UamAttributes } from '@/database/attributes';
import { Menu, Role, Uam } from '@/database/entities';
import { Transaction } from 'sequelize';

export class UamRepository {
  private readonly filterDeleted = { deletedAt: null };

  public async update(
    id: string,
    data: Partial<UamAttributes>,
    transaction?: Transaction
  ): Promise<UamAttributes> {
    try {
      const [updatedCount, [updatedUam]] = await Uam.update(data, {
        where: { id, ...this.filterDeleted },
        returning: true,
        transaction,
      });
      if (updatedCount === 0) {
        throw new Error('UAM not found');
      }
      return updatedUam.get();
    } catch (error: any) {
      throw error;
    }
  }

  public async create(
    data: Partial<UamAttributes>,
    transaction?: Transaction
  ): Promise<UamAttributes> {
    try {
      const newUam = await Uam.create(data, { transaction });
      return newUam.get();
    } catch (error: any) {
      throw error;
    }
  }

  public async delete(
    id: string,
    userId: string,
    transaction?: Transaction
  ): Promise<void> {
    try {
      await Uam.update(
        { deletedAt: new Date(), deletedBy: userId },
        {
          where: { id, ...this.filterDeleted },
          transaction,
        }
      );
    } catch (error: any) {
      throw error;
    }
  }

  public async getOneByConditions(
    condition: any,
    transaction?: Transaction
  ): Promise<UamAttributes | null> {
    try {
      const conditions = { ...this.filterDeleted, ...condition };
      const uam = await Uam.findOne({
        where: conditions,
        include: [
          {
            model: Menu,
            as: 'menu',
            where: { ...this.filterDeleted },
            required: false,
          },
          {
            model: Role,
            as: 'role',
            where: { ...this.filterDeleted },
            required: false,
          },
        ],
        transaction,
      });
      return uam ? uam.get() : null;
    } catch (error: any) {
      throw error;
    }
  }

  public async getByRole(
    conditions: any,
    pagination: any,
    transaction?: Transaction
  ): Promise<any> {
    try {
      const { page, limit, order, sort } = pagination;

      // Validate pagination parameters
      if (!page || !limit || !order || !sort) {
        throw new Error('Missing required pagination parameters');
      }

      const menuConditions = { ...this.filterDeleted };
      if (conditions.menu) {
        menuConditions['menu'] = conditions.menu;
        delete conditions.menu;
      }

      // Handle complex ordering for nested fields
      let orderClause: any;
      if (order === 'menu') {
        orderClause = [['menu', 'menu', sort]];
      } else if (order.includes('.')) {
        const [model, field] = order.split('.');
        orderClause = [[model, field, sort]];
      } else {
        orderClause = [[order, sort]];
      }

      const { rows, count } = await Uam.findAndCountAll({
        where: { ...this.filterDeleted, ...conditions },
        offset: (page - 1) * limit,
        limit,
        order: orderClause,
        include: [
          {
            model: Menu,
            as: 'menu',
            where: menuConditions,
          },
          {
            model: Role,
            as: 'role',
            where: { ...this.filterDeleted },
          },
        ],

        transaction,
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
      throw new Error(
        `Repository error: ${error?.message || 'Unknown error in getByRole'}`
      );
    }
  }

  public async getAllByRole(
    condition: any,
    transaction?: Transaction
  ): Promise<UamAttributes[]> {
    try {
      const conditions = { ...this.filterDeleted, ...condition };
      const data = await Uam.findAll({
        where: conditions,
        include: [
          {
            model: Menu,
            as: 'menu',
            where: { ...this.filterDeleted },
          },
          {
            model: Role,
            as: 'role',
            where: { ...this.filterDeleted },
          },
        ],

        transaction,
      });

      return data?.map((item) => item.get()) ?? [];
    } catch (error: any) {
      throw error;
    }
  }
}
