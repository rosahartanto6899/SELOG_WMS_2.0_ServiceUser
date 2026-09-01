import { injectable, inject } from 'inversify';
import { HTTP_STATUS } from '@/shared-libs/constants/http-status.constant';
import {
  ByIdTransform,
  DropdownTransform,
  GetAllTransform,
} from './transforms';
import { Pagination } from '@/shared-libs/helpers/pagination.helper';
import { NotFoundException } from '@/shared-libs/exceptions';
import moment from 'moment';
import { MenuRepository } from './repositories';
import { Op } from 'sequelize';
import { Request } from 'express';

@injectable()
export class QueryService {
  constructor(
    @inject(MenuRepository) private readonly menuRepository: MenuRepository
  ) {}

  /**
   * Get menu by id
   *
   * @param id - ID of menu
   *
   * @returns {Promise<Object>} - Object containing data and http status code
   */
  public async byId(id: any): Promise<object> {
    const menu = await this.menuRepository.getOneByCondition({ id });

    if (menu === null) {
      throw new NotFoundException('data not found');
    }

    return {
      data: ByIdTransform.object(menu),
      httpCode: HTTP_STATUS.OK,
    };
  }

  /**
   * Dropdown menus
   *
   * @param req Express Request
   * @returns Promise<{ data: Menu[], httpCode: number }>
   */
  public async dropdown(req: any) {
    const param = req.query;
    const search = param?.search;

    let whereConditions = [];
    if (search) {
      const arraySearch = ['name', 'description'];
      whereConditions = arraySearch.map((item) => ({
        [item]: { [Op.like]: `%${search}%` },
      }));
    }

    let order = param.order ?? 'createdAt';
    let sort = param.sort ?? 'asc';

    const data = await this.menuRepository.getAllByCondition(whereConditions, {
      order,
      sort,
    });

    return {
      data: DropdownTransform.array(data),
      httpCode: HTTP_STATUS.OK,
    };
  }

  /**
   * Get all menus
   *
   * @param req Express Request
   *
   * @returns Promise<{ page: number, data: Menu[], httpCode: number }>
   */
  async getAll(req: any) {
    const param = req.query;
    const search = param?.search;
    const field = param?.searchBy;

    let whereConditions: any = {
      parentId: null,
    };
    const replaceField: Record<string, string> = {
      menuName: 'menu',
      menuLink: 'url',
      menuOrder: 'order',
    };

    if (search) {
      whereConditions = {
        ...whereConditions,
        [replaceField[field]]: { [Op.like]: `%${search}%` },
      };
    }

    let order = param?.order ?? 'createdAt';
    let sort = param.sort ?? 'asc';

    order = replaceField[order] ?? order;

    const { page, limit, offset } = Pagination.getPagination(
      parseInt(param.page ?? '1', 10),
      parseInt(param.limit ?? '10', 10)
    );

    const { data, pagination } = await this.menuRepository.getAllWithPagination(
      whereConditions,
      {
        page,
        limit,
        offset,
        order,
        sort,
      }
    );

    const dataResult = data.filter((item: any) => item.parentId === null);

    return {
      page: pagination,
      data: GetAllTransform.array(dataResult),
      httpCode: HTTP_STATUS.OK,
    };
  }

  /**
   * Get all parent menus.
   *
   * @param req Express Request
   * @param {string} req.query.search Search query
   * @param {string} [req.query.order=createdAt] Sort order
   * @param {"asc"|"desc"} [req.query.sort=asc] Sort order
   * @returns Promise<{ data: Menu[], httpCode: number }>
   */
  async parentDropdown(req: any) {
    const { search, order = 'createdAt', sort = 'asc' } = req.query;

    const searchConditions = search
      ? ['name', 'description'].map((field) => ({
          [field]: { [Op.like]: `%${search}%` },
        }))
      : [];

    searchConditions.push({ parentId: null });

    const menus = await this.menuRepository.getAllByCondition(
      searchConditions,
      { order, sort }
    );

    const menuMap = new Map();
    const data = menus.reduce((result, menu) => {
      const menuItem = {
        id: menu.id,
        menuName: menu.menu,
        parentId: menu.parentId,
        menuIcon: menu.icon,
        menuLink: menu.url,
        createdAt: moment(menu.createdAt).format('YYYY-MM-DD HH:mm:ss'),
        createdBy: menu.createdBy,
        updatedAt: moment(menu.updatedAt).format('YYYY-MM-DD HH:mm:ss'),
        updatedBy: menu.updatedBy,
        children: [],
      };

      menuMap.set(menuItem.id, menuItem);

      if (menuItem.parentId) {
        const parentMenu = menuMap.get(menuItem.parentId);
        if (parentMenu) {
          parentMenu.children.push(menuItem);
        }
      } else {
        result.push(menuItem);
      }

      return result;
    }, []);

    return { data, httpCode: HTTP_STATUS.OK };
  }

  /**
   * Get leaf menus dropdown (menus without children)
   *
   * @param req Express Request
   * @param {string} req.query.search Search query
   * @param {number} req.query.level Filter by level
   * @returns Promise<{ data: Menu[], httpCode: number }>
   */
  async leafMenusDropdown(req: Request) {
    const { search, level }: { search?: string; level?: string } = req.query;

    let whereConditions: any = {};

    // Add search condition
    if (search) {
      whereConditions.menu = { [Op.like]: `%${search}%` };
    }

    // Add level filter
    if (level) {
      whereConditions.level = parseInt(level, 10);
    }

    const data = await this.menuRepository.getLeafMenusForDropdown(
      whereConditions
    );

    return {
      data,
      httpCode: HTTP_STATUS.OK,
    };
  }
}
