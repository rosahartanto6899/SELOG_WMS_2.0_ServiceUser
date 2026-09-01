import { injectable, inject } from 'inversify';
import {
  ByIdTransform,
  ByRoleTransform,
} from '@/features/v1/users-access/transforms';
import { HTTP_STATUS } from '@/shared-libs/constants/http-status.constant';
import { Pagination } from '@/shared-libs/helpers/pagination.helper';
import { DateHelper } from '@/shared-libs/helpers/date.helper';
import { RoleRepository, UamRepository, MenuRepository } from './repositories';
import { Op } from 'sequelize';
import {
  InternalServerErrorException,
  NotFoundException,
} from '@/shared-libs/exceptions';

@injectable()
export class QueryService {
  constructor(
    @inject(UamRepository) private readonly uamRepository: UamRepository,
    @inject(RoleRepository) private readonly roleRepository: RoleRepository,
    @inject(MenuRepository) private readonly menuRepository: MenuRepository
  ) {}

  async byId(id: string) {
    const data = await this.uamRepository.getOneByConditions({ id });

    if (!data) {
      throw new NotFoundException('UAM not found');
    }

    return {
      data: ByIdTransform.object(data),
      httpCode: HTTP_STATUS.OK,
    };
  }

  /**
   * Get all user access by role
   * @param req Express Request
   * @returns Promise<{ page: number, data: Uam[], httpCode: number }>
   */
  async byRole(req: any) {
    try {
      const param = req.query || {};
      const roleId = param.roleId;
      const field = param?.searchBy;
      const search = param.search;

      // Validate required roleId parameter
      if (!roleId) {
        throw new Error('roleId parameter is required');
      }

      let whereConditions: any = {
        roleId,
      };

      const replaceField: Record<string, string> = {
        menuName: 'menu',
      };

      if (search && field) {
        whereConditions = {
          ...whereConditions,
          [replaceField[field] ?? field]: { [Op.like]: `%${search}%` },
        };
      }

      let order = param?.order ?? 'createdAt';
      let sort = param.sort ?? 'asc';

      order = replaceField[order] ?? order;

      const { page, limit, offset } = Pagination.getPagination(
        parseInt(param.page ?? '1', 10),
        parseInt(param.limit ?? '10', 10)
      );

      const { data, pagination } = await this.uamRepository.getByRole(
        whereConditions,
        {
          page,
          limit,
          order,
          sort,
          offset,
        }
      );

      return {
        page: pagination,
        data: ByRoleTransform.array(data),
        httpCode: HTTP_STATUS.OK,
      };
    } catch (error: any) {
      throw new InternalServerErrorException(
        error?.message || 'Unknown error occurred in byRole method'
      );
    }
  }

  /**
   * Get all user access by role with optimized approach.
   *
   * @param req Express Request
   * @returns Promise<any>
   */
  async getAll(req: any) {
    const user = req.user;
    const role = await this.roleRepository.getOneByConditions({
      name: user.tokenRole,
    });
    const roleId = role.id;

    // Get menus with UAM records and build complete hierarchy
    const menusWithUAM = await this.menuRepository.getMenusWithUAMByRole(
      roleId
    );
    const allMenus = await this.buildCompleteMenuHierarchy(menusWithUAM);

    // Transform menus to menu items and build hierarchy
    const menuMap = this.transformMenusToMenuItems(allMenus, roleId);
    const hierarchyData = this.buildMenuHierarchy(menuMap);
    const filteredData = this.filterMenusByReadPermission(hierarchyData);

    return {
      data: filteredData,
      httpCode: HTTP_STATUS.OK,
    };
  }

  /**
   * Transform raw menu data to structured menu items
   */
  private transformMenusToMenuItems(
    allMenus: any[],
    roleId: string
  ): Map<string, any> {
    const menuMap = new Map();

    for (const menu of allMenus) {
      const uam =
        menu.hasUAM && menu.uams && menu.uams.length > 0 ? menu.uams[0] : null;

      const menuItem = {
        id: menu.id,
        menuName: menu.menu,
        parentId: menu.parentId,
        menuIcon: menu.icon,
        menuLink: menu.url,
        order: menu.order,
        isTab: menu.isTab ?? false,
        createdAt: DateHelper.formatDefault(menu.createdAt),
        createdBy: menu.createdBy,
        updatedAt: DateHelper.formatDefault(menu.updatedAt),
        updatedBy: menu.updatedBy,
        parent: null,
        data: this.createMenuItemData(uam, roleId, menu),
        child: [],
      };
      menuMap.set(menuItem.id, menuItem);
    }

    return menuMap;
  }

  /**
   * Create menu item data structure based on UAM permissions
   */
  private createMenuItemData(uam: any, roleId: string, menu: any): any {
    return {
      id: uam?.id,
      roleId: roleId,
      menuId: menu.id,
      isRead: uam?.canRead || false,
      isCreate: uam?.canCreate || false,
      isUpdate: uam?.canUpdate || false,
      isDelete: uam?.canDelete || false,
      isExport: false,
      levelsId: menu.level,
      createdAt: uam ? DateHelper.formatDefault(uam.createdAt) : null,
      createdBy: uam?.createdBy || null,
      updatedAt: uam ? DateHelper.formatDefault(uam.updatedAt) : null,
      updatedBy: uam?.updatedBy || null,
    };
  }

  /**
   * Build parent-child hierarchy from menu map
   */
  private buildMenuHierarchy(menuMap: Map<string, any>): any[] {
    const data = [];

    for (const menuItem of menuMap.values()) {
      if (menuItem.parentId) {
        const parentMenu = menuMap.get(menuItem.parentId);
        if (parentMenu) {
          parentMenu.child.push(menuItem);
          parentMenu.data.isRead = true; // Ensure parent menu is readable if it has children
        }
      } else {
        data.push(menuItem);
      }
    }

    return data;
  }

  /**
   * Filter menus based on read permissions recursively
   */
  private filterMenusByReadPermission(menuItems: any[]): any[] {
    return menuItems.filter((menuItem) => {
      if (menuItem.child && menuItem.child.length > 0) {
        menuItem.child = this.filterMenusByReadPermission(menuItem.child);
        return menuItem.child.length > 0;
      }
      return menuItem.data?.isRead === true;
    });
  }

  /**
   * Business logic to build complete menu hierarchy
   * This method handles the logic of finding parent menus and building the hierarchy
   */
  private async buildCompleteMenuHierarchy(
    menusWithUAM: any[]
  ): Promise<any[]> {
    try {
      const menuWithUAMIds = menusWithUAM.map((menu) => menu.id);
      let allMenus = [...menusWithUAM.map((m) => ({ ...m, hasUAM: true }))];
      let currentMenus = menusWithUAM;

      // Recursively find and fetch parent menus
      while (currentMenus.length > 0) {
        // Get unique parent IDs from current menus that we don't already have
        const parentIds = [
          ...new Set(
            currentMenus
              .map((menu) => menu.parentId)
              .filter(
                (parentId) =>
                  parentId &&
                  !menuWithUAMIds.includes(parentId) &&
                  !allMenus.find((m) => m.id === parentId)
              )
          ),
        ];

        if (parentIds.length === 0) break;

        // Fetch parent menus using repository
        const parentMenus = await this.menuRepository.getMenusByParentIds(
          parentIds
        );

        if (parentMenus.length === 0) break;

        // Add parent menus to the collection with default permissions
        const parentMenusData = parentMenus.map((menu) => ({
          ...menu,
          hasUAM: false,
          uams: [], // Empty UAMs for parent menus
        }));

        allMenus = [...allMenus, ...parentMenusData];
        currentMenus = parentMenusData; // Continue with these parents in next iteration
      }

      return allMenus;
    } catch (error: any) {
      throw new InternalServerErrorException(
        error?.message || 'Error building menu hierarchy'
      );
    }
  }
}
