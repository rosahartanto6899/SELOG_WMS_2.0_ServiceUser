import { Op, Transaction, WhereOptions } from 'sequelize';
import { Role, User, UserRole, UserRoleWarehouse, Warehouse } from '@/database/entities';
import { UserAttributes } from '@/database/attributes';
import { default as SecretManager } from '@/shared-libs/utils/secret-manager.util';

export class UserRepository {
  private readonly filterDeleted = { deletedAt: { [Op.is]: null } };

  public async create(
    data: UserAttributes,
    transaction?: Transaction,
  ): Promise<any> {
    const user = await User.create(data, { transaction, returning: true });
    return user;
  }

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
                    attributes: ['id', 'customerId'],
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

  public async getByIds(ids: string[]): Promise<any[]> {
    const conditions = { id: { [Op.in]: ids }, ...this.filterDeleted };
    const users = await User.findAll({
      where: conditions,
    });

    return users?.map((user) => user.get({ plain: true })) || [];
  }

  public async countByBranchId(id: string): Promise<number> {
    const conditions = { ...this.filterDeleted };
    const user = await User.count({
      where: conditions,
      distinct: true,
      include: [
        {
          model: UserRole,
          as: 'userRoles',
          required: true,
          include: [
            {
              model: Role,
              as: 'role',
              required: true,
            },
            {
              model: UserRoleWarehouse,
              as: 'warehouses',
              where: { warehouseId: id },
              required: true,
            },
          ],
        },
      ],
    });

    return user;
  }

  public async getOneByConditions(
    conditions: WhereOptions<UserAttributes>,
  ): Promise<UserAttributes | null> {
    try {
      const user = await User.findOne({
        where: { ...conditions, ...this.filterDeleted },
      });

      return user ? (user.get() as UserAttributes) : null;
    } catch (error) {
      throw error;
    }
  }

  public async update(
    id: string,
    payload: Partial<UserAttributes>,
    transaction?: Transaction,
  ): Promise<any> {
    try {
      const [_, affectedRows] = await User.update(payload, {
        where: { id, ...this.filterDeleted },
        returning: true,
        transaction,
      });
      return affectedRows[0];
    } catch (error) {
      throw error;
    }
  }

  public async delete(
    id: string,
    userId: string,
    transaction?: Transaction,
  ): Promise<any> {
    try {
      const user = await User.update(
        {
          deletedAt: new Date(),
          deletedBy: userId,
        },
        {
          where: { id, ...this.filterDeleted },
          transaction,
          returning: true,
        },
      );

      return user[0] === 0 ? null : user[1][0];
    } catch (error) {
      throw error;
    }
  }

  public async getWithRolesAndBranches(
    condition: Partial<UserAttributes>,
    roleWhere: any,
    pagination: {
      page: number;
      limit: number;
      order: string;
      sort: 'ASC' | 'DESC';
    },
  ): Promise<{
    data: (UserAttributes & { userRoles: any[] })[];
    pagination: {
      page: number;
      limit: number;
      totalData: number;
      totalPage: number;
    };
  }> {
    try {
      const { page, limit, order, sort } = pagination;

      const conditions = {
        ...this.filterDeleted,
        ...condition,
      };

      const include: any = [
        {
          model: UserRole,
          as: 'userRoles',
          required: !!roleWhere,
          include: [
            {
              model: Role,
              as: 'role',
              required: !!roleWhere,
              where: roleWhere || undefined,
            },
          ],
        },
      ];

      const totalData = await User.count({
        where: conditions,
        include,
        distinct: true,
        col: 'id',
      });

      const users = await User.findAll({
        attributes: ['id'],
        where: conditions,
        include,
        offset: (page - 1) * limit,
        limit,
        order: [[order, sort]],
        subQuery: false,
        raw: true,
      });

      const userIds = [...new Set(users.map((x: any) => x.id))];

      const rows = await User.findAll({
        where: {
          id: {
            [Op.in]: userIds,
          },
        },
        include: [
          {
            model: UserRole,
            as: 'userRoles',
            include: [
              { model: Role, as: 'role' },
              { model: UserRoleWarehouse, as: 'warehouses' },
            ],
          },
        ],
        order: [[order, sort]],
      });

      const plainRows: (UserAttributes & { userRoles: any[] })[] =
        rows.map(
          (user) =>
            user.get({ plain: true }) as UserAttributes & {
              userRoles: any[];
            },
        );

      return {
        data: plainRows,
        pagination: {
          page,
          limit,
          totalData,
          totalPage: Math.ceil(totalData / limit),
        },
      };
    } catch (error) {
      throw error;
    }
  }

  public async getRoleAndBranchByEmail(params: {
    roleNames?: string[];
    branchIds?: string[];
    email?: string;
  }): Promise<
    {
      id: string;
      email: string;
      name: string;
      roleName: string;
      branchId: string;
    }[]
  > {
    const { roleNames, branchIds, email } = params;
    const userWhere: any = { ...this.filterDeleted };

    if (email) userWhere.email = email;

    const include: any = [
      {
        model: UserRole,
        as: 'userRoles',
        include: [
          {
            model: Role,
            as: 'role',
            where: roleNames?.length
              ? { name: { [Op.in]: roleNames } }
              : undefined,
          },
          {
            model: UserRoleWarehouse,
            as: 'warehouses',
            where: branchIds?.length
              ? { warehouseId: { [Op.in]: branchIds } }
              : undefined,
          },
        ],
      },
    ];
    const users = await User.findAll({
      where: userWhere,
      include,
    });
    const result: {
      id: string;
      email: string;
      name: string;
      roleName: string;
      branchId: string;
    }[] = [];

    users.forEach((user) => {
      const u = user.get({ plain: true }) as UserAttributes & {
        userRoles: any[];
      };
      u.userRoles.forEach((ur: any) => {
        const role = ur.role;
        const branches = ur.branches || [];
        if (branches.length === 0) {
          result.push({
            id: u.id,
            email: u.email,
            name: u.name,
            roleName: role.name,
            branchId: null,
          });
        } else {
          branches.forEach((b: any) => {
            result.push({
              id: u.id,
              email: u.email,
              name: u.name,
              roleName: role.name,
              branchId: b.branchId,
            });
          });
        }
      });
    });

    return result;
  }

  public async getTokenList(
    params: {
      email?: string[];
      roles?: number[];
    },
    transaction?: Transaction,
  ): Promise<UserAttributes[]> {
    const { email = [], roles = [] } = params;

    if (email.length > 0) {
      const usersRaw = await User.findAll({
        attributes: [
          [User.sequelize.fn('DISTINCT', User.sequelize.col('token')), 'token'],
        ],
        where: {
          ...this.filterDeleted,
          email: { [Op.in]: email },
        },
        transaction,
      });

      const users = usersRaw.map((user) => user.get({ plain: true }));

      return users;
    } else if (roles.length > 0) {
      const usersRaw = await User.findAll({
        attributes: [
          [User.sequelize.fn('DISTINCT', User.sequelize.col('token')), 'token'],
          'email',
        ],
        include: [
          {
            model: UserRole,
            as: 'userRoles',
            attributes: [],
            where: { roleId: { [Op.in]: roles } },
            required: true,
          },
        ],
        where: this.filterDeleted,
        transaction,
      });

      const users = usersRaw.map((user) => user.get({ plain: true }));

      return users;
    } else {
      return [];
    }
  }

  public async getByRoleId(
    roleId: string,
    branchId?: string,
  ): Promise<(UserAttributes & { userRoles: any[] })[]> {
    const conditions = { ...this.filterDeleted };

    const users = await User.findAll({
      where: conditions,
      include: [
        {
          model: UserRole,
          as: 'userRoles',
          where: { roleId },
          required: true,
          include: [
            {
              model: Role,
              as: 'role',
            },
            {
              model: UserRoleWarehouse,
              as: 'warehouses',
              where: branchId ? { warehouseId: branchId } : undefined,
              required: !!branchId,
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    const plainRows: (UserAttributes & { userRoles: any[] })[] = users.map(
      (user) =>
        user.get({ plain: true }) as UserAttributes & { userRoles: any[] },
    );

    return plainRows;
  }

  public async getByRoleIds(
    ids: string[],
  ): Promise<(UserAttributes & { userRoles: any[] })[]> {
    const conditions = { ...this.filterDeleted };
    const users = await User.findAll({
      where: conditions,
      include: [
        {
          model: UserRole,
          as: 'userRoles',
          where: { roleId: { [Op.in]: ids } },
          required: true,
          include: [
            {
              model: Role,
              as: 'role',
            },
            {
              model: UserRoleWarehouse,
              as: 'warehouses',
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    const plainRows: (UserAttributes & { userRoles: any[] })[] = users.map(
      (user) =>
        user.get({ plain: true }) as UserAttributes & { userRoles: any[] },
    );
    return plainRows;
  }

  public async getSalesList(): Promise<
    (UserAttributes & { userRoles: any[] })[]
  > {
    const conditions = { ...this.filterDeleted };

    const users = await User.findAll({
      where: conditions,
      order: [['name', 'ASC']],
      raw: true,
      include: [
        {
          model: UserRole,
          as: 'userRoles',
          where: {
            roleId: SecretManager.env.ROLE_ID_SALES,
            ...this.filterDeleted,
          },
          required: true,
          attributes: [],
        },
      ],
    });

    return users as unknown as (UserAttributes & { userRoles: any[] })[];
  }
}
