import { injectable, inject } from 'inversify';
import { HTTP_STATUS } from '@/shared-libs/constants/http-status.constant';
import {
  BadRequestException,
  NotFoundException,
} from '@/shared-libs/exceptions';
import { MenuRepository, UamRepository } from './repositories';
import { sequelize } from '@/utils';
import { Op } from 'sequelize';
import { Request } from 'express';

@injectable()
export class CommandService {
  constructor(
    @inject(MenuRepository) private readonly menuRepository: MenuRepository,
    @inject(UamRepository) private readonly uamRepository: UamRepository,
  ) {}

  /**
   * Creates a new menu entry.
   *
   * @param req - The request object containing the menu data.
   *              The body should include menu details such as menuName.
   *
   * This method checks if a menu with the same name already exists.
   * If it does, it throws a BadRequestException. Otherwise, it saves
   * the new menu along with associated roles.
   *
   * @returns An object indicating the creation status with an HTTP code.
   *
   * @throws BadRequestException if a menu with the same name exists
   *                             or any error occurs during the operation.
   */
  public async create(req: any) {
    const body = req.body;

    const checkDuplicate = await this.menuRepository.getOneByCondition({
      menu: body.menuName,
    });

    if (checkDuplicate) {
      throw new BadRequestException(`Menu ${body.menuName} already exist`);
    }

    const checkLink = await this.menuRepository.getOneByCondition({
      url: body.menuLink,
    });

    if (checkLink) {
      throw new BadRequestException(`Menu link ${body.menuLink} already exist`);
    }

    if (body.menuOrder && body.menuOrder > 0) {
      const checkOrder = await this.menuRepository.getOneByCondition({
        order: body.menuOrder,
        parentId: body.parentId ?? null,
      });

      if (checkOrder) {
        throw new BadRequestException(
          `Menu order ${body.menuOrder} already exist`,
        );
      }
    }

    await this.saveMenu(body, req);
    return {
      data: null,
      httpCode: HTTP_STATUS.CREATED,
    };
  }

  /**
   * Saves a new menu entry and associates it with roles.
   *
   * @param body - The request body containing menu details such as menuName, menuLink, and menuIcon.
   *               The parentId is used to determine the menu level.
   *
   * @param roles - A list of roles to associate with the new menu. Each role's name is used to determine
   *                permissions (e.g., only 'ADMIN' roles have all permissions).
   *
   * This method creates a new menu entry and maps it to roles with specific permissions.
   * It uses a database transaction to ensure all changes are saved atomically.
   */
  private async saveMenu(body: any, req: Request): Promise<void> {
    const t = await sequelize.transaction();
    const user = req.user;
    try {
      const dataMenu = {
        menu: body.menuName,
        url: body.menuLink,
        order: body.menuOrder ?? 0,
        isTab: body.isTab ?? false,
        icon: body.menuIcon ?? null,
        level: body.parentId ? 2 : 1,
        parentId: body.parentId ?? null,
        createdBy: user.tokenUserId,
      };
      await this.menuRepository.create(dataMenu, t);
      await t.commit();
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Updates a menu with the given ID using the provided request data.
   *
   * @param id - The ID of the menu to be updated.
   * @param req - The request object containing user and body data.
   *
   * @returns An object indicating the update status with an HTTP code.
   *
   * @throws BadRequestException if the update fails.
   */
  public async update(id: any, req: any) {
    const checkExist = await this.menuRepository.getOneByCondition({ id });
    if (!checkExist) {
      throw new NotFoundException(`Menu not found`);
    }

    const body = req.body;
    const dataMenu = {
      menu: body.menuName,
      url: body.menuLink,
      order: body.menuOrder ?? 0,
      isTab: body.isTab ?? false,
      icon: body.menuIcon ?? null,
      level: body.parentId ? 2 : 1,
      parentId: body.parentId ?? null,
      updatedBy: req.user.tokenUserId,
    };

    const checkDuplicate = await this.menuRepository.getOneByCondition({
      menu: body.menuName,
      id: { [Op.ne]: id },
    });

    if (checkDuplicate) {
      throw new BadRequestException(`Menu ${body.menuName} already exist`);
    }

    const checkLink = await this.menuRepository.getOneByCondition({
      url: body.menuLink,
      id: { [Op.ne]: id },
    });

    if (checkLink) {
      throw new BadRequestException(`Menu link ${body.menuLink} already exist`);
    }

    if (body.menuOrder && body.menuOrder !== checkExist.order) {
      const checkOrder = await this.menuRepository.getOneByCondition({
        order: body.menuOrder,
        parentId: body.parentId ?? null,
        id: { [Op.ne]: id },
      });

      if (checkOrder) {
        throw new BadRequestException(
          `Menu order ${body.menuOrder} already exist`,
        );
      }
    }

    await this.menuRepository.update(id, dataMenu);

    return {
      data: null,
      httpCode: HTTP_STATUS.OK,
    };
  }

  /**
   * Delete a menu by ID.
   *
   * @param id - The ID of the menu to be deleted.
   *
   * @returns An object indicating the deletion status with an HTTP code.
   *
   * @throws BadRequestException if the menu is not found or the deletion fails.
   */
  public async delete(id: any, req: any) {
    const user = req.user;
    const t = await sequelize.transaction();
    try {
      const checkExist = await this.menuRepository.getOneByCondition({ id });
      if (!checkExist) {
        throw new NotFoundException(`Menu not found`);
      }
      const menuChildren = await this.menuRepository.getAllByCondition(
        [{ parentId: id }],
        { order: 'createdAt', sort: 'asc' },
        t,
      );

      if (menuChildren.length > 0) {
        const menuChildrenIds = menuChildren.map((menu: any) => menu.id);
        await this.uamRepository.deleteByConditions(
          { menuId: menuChildrenIds },
          user.tokenUserId,
          t,
        );

        await this.menuRepository.deleteByConditions(
          { id: menuChildrenIds },
          user.tokenUserId,
          t,
        );
      }

      await this.uamRepository.deleteByConditions(
        { menuId: id },
        user.tokenUserId,
        t,
      );
      await this.menuRepository.deleteByConditions({ id }, user.tokenUserId, t);

      await t.commit();

      return {
        data: null,
        httpCode: HTTP_STATUS.OK,
      };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }
}
