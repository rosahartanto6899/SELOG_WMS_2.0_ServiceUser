import { injectable, inject } from 'inversify';
import { Request } from 'express';
import { ByIdTransform } from '@/features/v1/users-access/transforms/by-id.transform';
import { HTTP_STATUS } from '@/shared-libs/constants/http-status.constant';
import {
  BadRequestException,
  NotFoundException,
} from '@/shared-libs/exceptions';
// import { default as cache } from '@/shared-libs/utils/cache.util'; // ponytail: sementara pakai memory-cache (tanpa Redis)
import { default as cache } from '@/utils/memory-cache.util';
import {
  MenuRepository,
  RoleRepository,
  UamRepository,
  UserRepository,
} from './repositories';
import { CreatePermissionDto, UpdateByIdDto } from './dtos';

@injectable()
export class CommandService {
  constructor(
    @inject(UamRepository) private readonly uamRepository: UamRepository,
    @inject(MenuRepository) private readonly menuRepository: MenuRepository,
    @inject(RoleRepository) private readonly roleRepository: RoleRepository,
    @inject(UserRepository) private readonly userRepository: UserRepository,
  ) {}

  /**
   * Update a UAM (User Access Management) entry by id.
   *
   * Performs the following steps:
   * 1. Reads the authenticated user from `req.user` (expected to be `IDataUser`) and the update payload from `req.body` (expected to be `UpdateByIdDto`).
   * 2. Loads the existing UAM record by the provided `id`. If not found, throws NotFoundException.
   * 3. Checks whether the menu referenced by the existing UAM (`data.menuId`) has child menus. If children exist, throws BadRequestException because permissions must be assigned to sub-menus instead of a parent menu.
   * 4. Maps integer permission flags in the request body (`isRead`, `isCreate`, `isUpdate`, `isDelete`) to boolean values (`canRead`, `canCreate`, `canUpdate`, `canDelete`).
   * 5. Sets `updatedBy` to the authenticated user's `tokenUserId` and updates the UAM record in the repository.
   * 6. Invalidates related cached access tokens by calling `deleteCacheTokenAccess` with the UAM's `roleId`.
   * 7. Returns a resolved promise containing the transformed updated record and an HTTP status code (HTTP_STATUS.OK).
   *
   * Notes:
   * - The method is asynchronous and returns a Promise.
   * - Expected inputs:
   *    - id: string — identifier of the UAM entry to update.
   *    - req: Request — Express request containing `user: IDataUser` and `body: UpdateByIdDto`.
   * - The method converts numeric flags (1) to booleans (true) for permission fields.
   *
   * @param id - The identifier of the UAM entry to update.
   * @param req - The Express request object containing authenticated user and update payload.
   * @returns A Promise that resolves to an object with the transformed updated UAM data and an HTTP status code (HTTP_STATUS.OK).
   * @throws NotFoundException - If no UAM entry exists for the given id.
   * @throws BadRequestException - If the menu associated with the UAM has sub-menus (permissions must be assigned to sub-menus).
   * @throws Error - Re-throws any unexpected errors; may also throw a generic Error('Unknown error') for non-Error throwables.
   */
  async updateById(id: string, req: Request) {
    try {
      const user = req.user;
      const body: UpdateByIdDto = req.body;

      const data = await this.uamRepository.getOneByConditions({
        id,
      });

      if (!data) {
        throw new NotFoundException('UAM not found');
      }

      const hasChildren = await this.menuRepository.getOneByCondition({
        parentId: data.menuId,
      });

      if (hasChildren) {
        throw new BadRequestException(
          'Cannot assign permissions to a menu that has sub-menus. Please assign permissions to the sub-menus instead.',
        );
      }

      const dataUpdate = {
        canRead: body.isRead === 1,
        canCreate: body.isCreate === 1,
        canUpdate: body.isUpdate === 1,
        canDelete: body.isDelete === 1,
        updatedBy: user.tokenUserId,
      };
      const updatedData = await this.uamRepository.update(id, dataUpdate);

      await this.deleteCacheTokenAccess(data.roleId);

      return {
        data: ByIdTransform.object(updatedData),
        httpCode: HTTP_STATUS.OK,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error');
    }
  }

  /**
   * Delete a UAM (User Access Management) entry by its identifier.
   *
   * Performs the following steps:
   * 1. Retrieves the UAM entry by `id`.
   * 2. If not found, throws a NotFoundException.
   * 3. Deletes the entry via the repository, using the authenticated user's `tokenUserId` for auditing.
   * 4. Invalidates related cache/token access for the deleted entry's `roleId`.
   * 5. Returns an object indicating success with `data: null` and `httpCode: HTTP_STATUS.OK`.
   *
   * @param id - The identifier of the UAM entry to delete.
   * @param req - The Express Request object; expects `req.user` to be an `IDataUser` containing at least `tokenUserId`.
   * @returns A Promise that resolves to an object: `{ data: null, httpCode: number }` (httpCode will be `HTTP_STATUS.OK` on success).
   * @throws {NotFoundException} When no UAM entry exists for the given `id`.
   * @throws {Error} Rethrows any Error instances encountered during execution.
   * @throws {Error} Throws a generic Error('Unknown error') if a non-Error value is thrown internally.
   */
  async deleteById(id: string, req: Request) {
    try {
      const user = req.user;
      const data = await this.uamRepository.getOneByConditions({
        id,
      });

      if (!data) {
        throw new NotFoundException('UAM not found');
      }

      await this.uamRepository.delete(id, user.tokenUserId);

      await this.deleteCacheTokenAccess(data.roleId);

      return {
        data: null,
        httpCode: HTTP_STATUS.OK,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error');
    }
  }

  /**
   * Create a user-access mapping (UAM) entry linking a role to a menu with specific permissions.
   *
   * Validations and behavior:
   * - Verifies the role exists. Throws BadRequestException('Role not found') if not.
   * - Verifies the menu exists. Throws BadRequestException('Menu not found') if not.
   * - Prevents creating a duplicate UAM for the same roleId + menuId. Throws BadRequestException('UAM already exist') if one exists.
   * - Prevents assigning permissions to a menu that has sub-menus. Throws BadRequestException(...) if the menu has children.
   * - Maps incoming flag fields (isRead, isCreate, isUpdate, isDelete) where a value of `1` means the permission is granted.
   * - Sets createdBy to the current user's tokenUserId.
   * - Persists the UAM via the repository and clears cached access tokens for the role.
   *
   * @param req - Express request. Expects:
   *   - req.user to be populated as IDataUser (must include tokenUserId),
   *   - req.body to match CreatePermissionDto (must include roleId and menuId and permission flags).
   * @returns A promise that resolves with an object containing:
   *   - data: the created UAM record returned by the repository,
   *   - httpCode: HTTP_STATUS.CREATED.
   *
   * @throws {BadRequestException} When role or menu is not found, when a UAM already exists for the role+menu,
   *   or when attempting to assign permissions to a menu that has sub-menus.
   * @throws {Error} Re-throws any repository/validation errors or an `Error('Unknown error')` for non-Error throwables.
   */
  async create(req: Request) {
    try {
      const user = req.user;
      const body: CreatePermissionDto = req.body;

      const checkRole = await this.roleRepository.getOneByConditions({
        id: body.roleId,
      });

      if (!checkRole) {
        throw new BadRequestException('Role not found');
      }

      const checkMenu = await this.menuRepository.getOneByCondition({
        id: body.menuId,
      });

      if (!checkMenu) {
        throw new BadRequestException('Menu not found');
      }

      const dataExist = await this.uamRepository.getOneByConditions({
        roleId: body.roleId,
        menuId: body.menuId,
      });

      if (dataExist) {
        throw new BadRequestException('UAM already exist');
      }

      const hasChildren = await this.menuRepository.getOneByCondition({
        parentId: body.menuId,
      });

      if (hasChildren) {
        throw new BadRequestException(
          'Cannot assign permissions to a menu that has sub-menus. Please assign permissions to the sub-menus instead.',
        );
      }

      const dataCreate = {
        roleId: body.roleId,
        menuId: body.menuId,
        canRead: body.isRead === 1,
        canCreate: body.isCreate === 1,
        canUpdate: body.isUpdate === 1,
        canDelete: body.isDelete === 1,
        createdBy: user.tokenUserId,
      };

      const uam = await this.uamRepository.create(dataCreate);

      await this.deleteCacheTokenAccess(body.roleId);

      return {
        data: uam,
        httpCode: HTTP_STATUS.CREATED,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error');
    }
  }

  /**
   * Removes cached access tokens for all users that have the given role.
   *
   * This method queries the user repository for users assigned to the provided
   * roleId and deletes each user's token access cache entry (keyed as
   * `tokenAccess:<userId>`). Use this when role membership changes or when
   * role permissions are updated and cached tokens must be invalidated.
   *
   * @param roleId - The identifier of the role whose users' token caches should be cleared.
   *                 Must be a valid, non-empty role id.
   * @returns A promise that resolves once all relevant cache entries have been deleted.
   * @throws If retrieving users or deleting cache entries fails, the returned promise
   *         will reject with the underlying error.
   */
  private async deleteCacheTokenAccess(roleId: string) {
    const usersWithRole = await this.userRepository.getUsersByRoleId(roleId);

    for (const user of usersWithRole) {
      await cache.delete(`tokenAccess:${user.id}`);
    }
  }
}
