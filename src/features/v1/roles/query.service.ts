import { injectable, inject } from 'inversify';
import { ByIdTransform, DropdownTransform, GetAllTransform } from './transform';
import { BadRequestException } from '@/shared-libs/exceptions';
import { HTTP_STATUS } from '@/shared-libs/constants/http-status.constant';
import { Pagination } from '@/shared-libs/helpers/pagination.helper';
import { RoleRepository } from './repositories';
import { Op } from 'sequelize';

@injectable()
export class QueryService {
  constructor(
    @inject(RoleRepository) private readonly roleRepository: RoleRepository
  ) {}

  /**
   * Find a role by given ID.
   *
   * @param id - The ID of the role.
   * @throws BadRequestException if the role is not found.
   * @returns An object indicating the query status with an HTTP code,
   *          and the role data if found.
   */
  async byId(id: any) {
    // Fetch the role from the database using the provided ID
    const role = await this.roleRepository.getOneByConditions({
      id,
    });

    // If no role is found, throw a BadRequestException
    if (role === null) {
      throw new BadRequestException('data not found');
    }

    // Return the transformed role data with an OK HTTP status
    return {
      data: ByIdTransform.object(role),
      httpCode: HTTP_STATUS.OK,
    };
  }

  /**
   * Dropdown roles
   * @param req Express Request
   * @returns Promise<{ data: Role[], httpCode: number }>
   */
  async dropdown(req: any) {
    const param = req.query;
    const search = param?.search;

    // Set default query conditions
    let whereConditions: any = {};

    // Add filters if search query is provided
    if (search) {
      const arraySearch = ['name'];
      whereConditions = arraySearch.map((item) => ({
        [item]: { [Op.like]: `%${search}%` },
      }));
    }

    // Set default sorting
    let order = param.order ?? 'createdAt';
    let sort = param.sort ?? 'asc';

    // Run the query
    const data = await this.roleRepository.getAllByConditions(whereConditions, {
      order,
      sort,
    });

    // Return the result
    return {
      data: DropdownTransform.array(data),
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

    // Set default query conditions
    let whereConditions: any = {};

    const replaceField: Record<string, string> = {
      roleName: 'name',
    };

    // Add filters if search query is provided
    if (search) {
      whereConditions = {
        ...whereConditions,
        [replaceField[field]]: { [Op.like]: `%${search}%` },
      };
    }

    // Set default ordering
    let order = param.order ?? 'createdAt';
    let sort = param.sort ?? 'asc';

    order = replaceField[order] ?? order;

    const { page, limit, offset } = Pagination.getPagination(
      parseInt(param.page ?? '1', 10),
      parseInt(param.limit ?? '10', 10)
    );

    // Execute query
    const { data, pagination } = await this.roleRepository.getAllWithPagination(
      whereConditions,
      {
        page,
        limit,
        offset,
        order,
        sort,
      }
    );

    // Return response
    return {
      page: pagination,
      data: GetAllTransform.array(data),
      httpCode: HTTP_STATUS.OK,
    };
  }
}
