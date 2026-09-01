import { inject, injectable } from 'inversify';
import { UserRepository } from './repositories';
import { BadRequestException } from '@/shared-libs/exceptions';
import { ByIdTransform, GetAllTransform } from './transforms';
import { HTTP_STATUS } from '@/shared-libs/constants/http-status.constant';
import { Op } from 'sequelize';
import { userConstant } from './constants/user.constant';
import { DropdownSalesTransform } from './transforms/dropdown-sales.transforms';
import { Request } from 'express';

@injectable()
export class QueryService {
  constructor(
    @inject(UserRepository) private readonly userRepository: UserRepository,
  ) { }

  /**
   * Find a user by given ID.
   *
   * @param id - The ID of the user that will be searched.
   *
   * @throws BadRequestException if the user is not found.
   *
   * @returns An object indicating the query status with an HTTP code,
   *          and the user data if found.
   */
  async byId(id: any) {
    const user = await this.userRepository.getById(id);

    if (user === null) {
      throw new BadRequestException('data not found');
    }

    return {
      data: ByIdTransform.object(user),
      httpCode: HTTP_STATUS.OK,
    };
  }

  async getByIds(req: Request) {
    const ids = req.body.ids;
    const users = await this.userRepository.getByIds(ids);

    return {
      data: users,
      httpCode: HTTP_STATUS.OK,
    };
  }

  async countByBranchId(id: string) {
    const count = await this.userRepository.countByBranchId(id);

    return {
      data: { count },
      httpCode: HTTP_STATUS.OK,
    };
  }

  /**
   * Get all roles
   * @param req Express Request
   * @returns Promise<{ page: number, data: Role[], httpCode: number }>
   */
  async getAll(req: any) {
    const param = req.query;
    const search = param?.search;
    const field = param?.searchBy;

    const allowedField = userConstant.columns;
    if (field && !allowedField.includes(field)) {
      throw new BadRequestException('Invalid search value.');
    }

    let whereConditions: any = {};
    let roleWhere: any = undefined;
    if (search && field && field !== 'role') {
      whereConditions = {
        ...whereConditions,
        [field]: { [Op.like]: `%${search}%` },
      };
    }
    if (search && field === 'role') {
      roleWhere = {
        name: {
          [Op.like]: `%${search}%`,
        },
      };
    }

    const order = param?.order || 'createdAt';
    const sort = (param?.sort?.toUpperCase() as 'ASC' | 'DESC') || 'DESC';
    const page = Number(param?.page) || 1;
    const limit = Number(param?.limit) || 10;

    const { data, pagination } =
      await this.userRepository.getWithRolesAndBranches(
        whereConditions, 
        roleWhere, 
       {
        page,
        limit,
        order,
        sort,
      });

    return {
      page: pagination,
      data: GetAllTransform.array(data),
      httpCode: HTTP_STATUS.OK,
    };
  }

  /**
   * Get users by role ID
   *
   * @param roleId - The ID of the role to filter users by
   * @param branchId - Optional branch ID to filter users by specific branch
   *
   * @returns An object indicating the query status with an HTTP code,
   *          and the array of users with that role
   */
  async getByRoleId(roleId: string, branchId?: string) {
    const users = await this.userRepository.getByRoleId(roleId, branchId);

    return {
      data: GetAllTransform.array(users),
      httpCode: HTTP_STATUS.OK,
    };
  }

  async getByRoleIds(req: Request) {
    const body = req.body;

    const users = await this.userRepository.getByRoleIds(body.ids);

    return {
      data: GetAllTransform.array(users),
      httpCode: HTTP_STATUS.OK,
    };
  }

  async getSalesDropdown() {
    const sales = await this.userRepository.getSalesList();

    return {
      data: DropdownSalesTransform.array(sales),
      httpCode: HTTP_STATUS.OK,
    };
  }
}
