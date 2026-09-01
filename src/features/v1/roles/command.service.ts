import { injectable, inject } from 'inversify';
import { HTTP_STATUS } from '@/shared-libs/constants/http-status.constant';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@/shared-libs/exceptions';
import {
  MenuRepository,
  RoleRepository,
  UamRepository,
  UserRoleRepository,
} from './repositories';
import { sequelize } from '@/utils';
import { Op } from 'sequelize';

@injectable()
export class CommandService {
  constructor(
    @inject(MenuRepository) private readonly menuRepository: MenuRepository,
    @inject(RoleRepository) private readonly roleRepository: RoleRepository,
    @inject(UamRepository) private readonly uamRepository: UamRepository,
    @inject(UserRoleRepository)
    private readonly userRoleRepository: UserRoleRepository
  ) {}

  /**
   * Creates a new role with the specified name and initializes its UAM (User Access Management) data.
   *
   * - Converts the provided role name to uppercase.
   * - Checks for duplicate role names and throws a `BadRequestException` if the name is already used.
   * - Creates the role and associates it with the requesting user.
   * - Retrieves all menus and initializes UAM permissions for each menu with default values (all permissions set to false).
   * - Saves the role and its UAM data in a single transaction.
   * - Commits the transaction on success, or rolls back and throws an `InternalServerErrorException` on failure.
   *
   * @param req - The request object containing the role name and user information.
   * @returns An object with `data` set to null and the HTTP status code for creation.
   * @throws {BadRequestException} If the role name is already used.
   * @throws {InternalServerErrorException} If an error occurs during the creation process.
   */
  async create(req: any): Promise<{ data: null; httpCode: number }> {
    const t = await sequelize.transaction();
    try {
      // Get the role name from the request body
      const roleName = req.body.roleName.toUpperCase();

      // Move duplicate check inside transaction
      const checkDuplicate = await this.roleRepository.getOneByConditions(
        { name: roleName },
        t
      );

      if (checkDuplicate) {
        throw new BadRequestException('Role name is already used');
      }

      // Create the role
      const dataRole = {
        name: roleName,
        description: req.body.roleName,
        createdBy: req.user.tokenUserId,
      };

      // Get all menus
      const menus = await this.menuRepository.getAll(t);

      // Create the initial UAM data for the new role
      const uamData = menus.map((menu) => ({
        menu,
        canCreate: false,
        canRead: false,
        canUpdate: false,
        canDelete: false,
        canEtc: false,
      }));

      // Save the role
      const role = await this.roleRepository.create(dataRole, t);

      // Update the UAM data with the new role
      const updatedUamData = uamData.map((item) => ({
        ...item,
        roleId: role.id,
        menuId: item.menu.id,
      }));

      // Save the UAM data
      await this.uamRepository.createBulk(updatedUamData, t);

      // Commit the transaction
      await t.commit();

      // Return a success response
      return {
        data: null,
        httpCode: HTTP_STATUS.CREATED,
      };
    } catch (error) {
      await t.rollback();
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        (error as Error).message || ('Unknown error' as any)
      );
    }
  }

  /**
   * Soft delete a role
   *
   * @param id - The ID of the role to be deleted
   * @param req - The request object containing the user data
   *
   * @returns An object indicating the deletion status with an HTTP code
   *
   * @throws BadRequestException if the role is not found or used by the users
   */
  async delete(id: any, req: any) {
    try {
      const user = req.user;

      // Check if the role is used by the users
      const check = await this.userRoleRepository.getByCondition({
        roleId: id,
      });
      if (check) {
        throw new BadRequestException('Role is used by the users');
      }

      // Soft delete the role
      const role = await this.roleRepository.deleteByConditions(
        {
          id: id,
        },
        user.tokenUserId
      );

      // Check if the data is found
      if (role === null) {
        throw new BadRequestException('data not found');
      }

      return {
        data: null,
        httpCode: HTTP_STATUS.OK,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        (error as Error).message || ('Unknown error' as any)
      );
    }
  }

  /**
   * Update a role with the given ID using the provided request data.
   *
   * @param id - The ID of the role to be updated.
   * @param req - The request object containing the user data.
   *
   * @returns An object indicating the update status with an HTTP code.
   *
   * @throws BadRequestException if the role is not found, or the role name is used by another role.
   */
  async update(id: any, req: any) {
    try {
      const { tokenUserId } = req.user;
      const roleName = req.body.roleName.toUpperCase();

      // Check if the role name is used by another role
      const check = await this.roleRepository.getOneByConditions({
        name: roleName,
        id: { [Op.not]: id },
      });

      if (check) {
        throw new BadRequestException('Role name is used by another role');
      }

      // Update the role
      const result = await this.roleRepository.update(
        {
          id: id,
        },
        {
          name: roleName,
          updatedBy: tokenUserId,
        }
      );

      // Check if the data is found
      if (result.affected === 0) {
        throw new BadRequestException('Invalid data');
      }

      // Return a success response
      return {
        data: null,
        httpCode: HTTP_STATUS.OK,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        (error as Error).message || ('Unknown error' as any)
      );
    }
  }
}
