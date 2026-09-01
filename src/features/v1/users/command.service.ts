import { injectable, inject } from 'inversify';
import { BadRequestException, ForbiddenException } from '@/shared-libs/exceptions';
import { HTTP_STATUS } from '@/shared-libs/constants/http-status.constant';
// import { default as cache } from '@/shared-libs/utils/cache.util'; // ponytail: sementara pakai memory-cache (tanpa Redis)
import { default as cache } from '@/utils/memory-cache.util';
import {
  IDataUser,
  IDataUserRole,
  IDataUserRoleWarehouse,
} from './interfaces/create.interface';
import {
  UserRepository,
  UserRoleRepository,
  UserRoleWarehouseRepository,
} from './repositories';
import { sequelize } from '@/utils';
import { Op } from 'sequelize';
import { Warehouse } from '@/database/entities';
import { hasRoleSuperAdminId, isSuperadmin } from '@/shared-libs/helpers/role.helper';

@injectable()
export class CommandService {
  constructor(
    @inject(UserRepository) private readonly userRepository: UserRepository,
    @inject(UserRoleRepository)
    private readonly userRoleRepository: UserRoleRepository,
    @inject(UserRoleWarehouseRepository)
    private readonly userRoleWarehouseRepository: UserRoleWarehouseRepository,
  ) { }

  /**
   * Creates a new user with associated roles and branches.
   *
   * @param req - The request object containing the user and body data.
   *              The body should include user details such as name, email, phone,
   *              isActive status, and roles with associated branches.
   *
   * This method initiates a database transaction to save the user details,
   * assigns roles to the user, and links branches to each role. It handles
   * any errors by throwing a BadRequestException with the error message.
   *
   * @returns An object indicating the creation status with an HTTP code.
   *
   * @throws BadRequestException if any error occurs during the operation.
   */
  async create(req: any) {
    const t = await sequelize.transaction();
    try {
      const user = req.user;
      const body = req.body;
      const sanitizedPhone = body.phone?.trim() || null;

      const dataUser: IDataUser = {
        name: body.name,
        email: body.email,
        phone: sanitizedPhone,
        isActive: body.isActive,
        nrp: body.nrp,
        createdBy: user.email,
      };

      const checkUser = await this.userRepository.getOneByConditions({
        [Op.or]: [
          { email: body.email },
          { nrp: body.nrp },
          ...(sanitizedPhone ? [{ phone: sanitizedPhone }] : []),
        ],
      });

      if (checkUser) {
        throw new BadRequestException('User already exists');
      }

      const userCreated = await this.userRepository.create(dataUser, t);

      const userId = userCreated.id;

      // Multi-tenant: roles[].accesses[] = [{ customerId, warehouses[] }]
      const allWarehouseIds = body.roles.flatMap((role: any) =>
        (role.accesses || []).flatMap((a: any) => a.warehouses),
      );
      const validWarehouses = await Warehouse.findAll({
        where: { id: { [Op.in]: allWarehouseIds } },
        paranoid: false,
      });
      const warehouseById = new Map(
        validWarehouses.map((w: any) => [w.id, w.get({ plain: true })]),
      );
      for (const role of body.roles) {
        for (const access of role.accesses || []) {
          const invalid = (access.warehouses || []).find((wid: string) => {
            const w: any = warehouseById.get(wid);
            return !w || w.customerId !== access.customerId;
          });
          if (invalid) {
            throw new BadRequestException(
              'Some warehouse are not registered under the selected customer',
            );
          }
        }
      }

      for (const role of body.roles) {
        const dataRole: IDataUserRole = {
          userId,
          roleId: role.id,
          createdAt: new Date(),
          createdBy: user.tokenUserId,
        };
        const userRole: IDataUserRole = await this.userRoleRepository.create(
          dataRole,
          t,
        );

        const roleWarehouseIds = (role.accesses || []).flatMap(
          (a: any) => a.warehouses,
        );
        for (const warehouseId of roleWarehouseIds) {
          const userRoleWarehouse: IDataUserRoleWarehouse = {
            userRoleId: userRole.id,
            warehouseId: warehouseId,
            createdAt: new Date(),
            createdBy: user.tokenUserId,
          };
          await this.userRoleWarehouseRepository.create(userRoleWarehouse, t);
        }
      }

      await t.commit();

      return {
        data: null,
        httpCode: HTTP_STATUS.CREATED,
      };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Soft delete a user
   *
   * @param id - The id of the user that will be deleted
   * @param req - The request object containing the user data
   *
   * @returns An object indicating the deletion status with an HTTP code
   *
   * @throws BadRequestException if the user is not found
   */
  async delete(id: any, req: any) {
    const user = req.user;

    if (isSuperadmin(user)) {
      throw new ForbiddenException('Superadmin cannot perform this action on themselves');
    }

    const dataUser = await this.userRepository.delete(id, user.tokenUserId);

    if (dataUser === null) {
      throw new BadRequestException('data not found');
    }

    return {
      data: null,
      httpCode: HTTP_STATUS.OK,
    };
  }

  /**
   * Update a user's profile, roles, and branch assignments inside a single transactional operation.
   *
   * This method performs the following steps:
   * 1. Retrieves the existing user by id.
   * 2. Builds an update payload for the user (name, isActive, phone, updatedBy). Phone is sanitized:
   *    - If `phone` is present in the request body and is null/empty string -> phone is set to `null`.
   *    - If `phone` is present and non-empty -> trimmed string value is used.
   *    - If `phone` is not present in the body -> phone is left `undefined` (no change).
   * 3. Calls an external master data service (using the request authorization header) to fetch all valid branches,
   *    and validates that every branch id referenced by `body.roles[*].branches` exists. If any branch id is invalid,
   *    a BadRequestException is thrown.
   * 4. Executes a sequelize transaction to:
   *    - Update the user record.
   *    - Remove existing user-role-branch associations for the user's previous roles.
   *    - Remove existing user-role assignments for the user.
   *    - Insert new user-role assignments from `body.roles`, and for each created user-role record, insert the
   *      corresponding user-role-branch records.
   *    - Invalidate the user's cached token access key `tokenAccess:{userId}` (set to null with TTL 2).
   *
   * Expected inputs:
   * - id: string — identifier of the user to update.
   * - req: any — HTTP-style request object containing:
   *    - req.user.tokenUserId: string — identifier of the user performing the operation (used for createdBy/updatedBy).
   *    - req.headers.authorization: string — bearer token passed to masterDataService.getAllBranches for branch validation.
   *    - req.body: {
   *        name?: string;
   *        isActive?: boolean;
   *        phone?: string | null;
   *        roles: Array<{
   *          id: string;
   *          branches: string[]; // branch ids
   *        }>;
   *      }
   *
   * Returns:
   * - Promise<{ data: null; httpCode: typeof HTTP_STATUS.OK }>
   *
   * Side effects:
   * - Mutates database state (user, user roles, user role branches) inside a transaction.
   * - Calls external masterDataService to validate branches.
   * - Invalidates cache key `tokenAccess:{userId}`.
   *
   * Throws:
   * - BadRequestException when one or more provided branch ids are not registered in master data.
   * - Any error thrown by repository operations, the master data service, or the transaction; rethrows Error instances.
   *
   * Notes:
   * - The method relies on injected repositories and services: userRepository, userRoleRepository,
   *   userRoleBranchRepository, masterDataService, sequelize (for transactions), cache, and uses Sequelize Op.
   * - The returned HTTP code on success is HTTP_STATUS.OK and the response body contains data: null.
   *
   * @param id - The user identifier to update.
   * @param req - The incoming request object containing user context, headers, and body payload.
   * @returns A promise resolving to an object with data null and httpCode HTTP_STATUS.OK on success.
   * @throws BadRequestException If any branch id in the provided roles is not found in master data.
   * @throws Error For unexpected failures during validation, database updates, or caching.
   */
  async update(id: string, req: any) {
    try {
      const user = req.user;

      if (id === user.tokenUserId) {
        throw new BadRequestException('You cannot update your own profile');
      }

      const userFound = await this.userRepository.getById(id);

      const userRoleIds = userFound.userRoles.map(
        (userRole: any) => userRole.id,
      );

      const body = req.body;

      if (!isSuperadmin(user) && hasRoleSuperAdminId(body.roles)) {
        throw new BadRequestException('Only superadmin can assign superadmin role');
      }

      let sanitizedPhone: string | null | undefined;

      if ('phone' in body) {
        if (body.phone == null || body.phone.trim() === '') {
          sanitizedPhone = null;
        } else {
          sanitizedPhone = body.phone.trim();
        }
      } else {
        sanitizedPhone = undefined;
      }

      const checkNrp = await this.userRepository.getOneByConditions({
        nrp: body.nrp,
        id: { [Op.ne]: id },
      });

      if (checkNrp) {
        throw new BadRequestException('NRP already exists');
      }

      const dataUser = {
        name: body.name,
        isActive: body.isActive,
        phone: sanitizedPhone,
        updatedBy: user.tokenUserId,
        nrp: body.nrp,
      };

      const allWarehouseIds = body.roles.flatMap((role) =>
        (role.accesses || []).flatMap((a) => a.warehouses),
      );
      const validWarehouses = await Warehouse.findAll({
        where: { id: { [Op.in]: allWarehouseIds } },
      });
      const warehouseById = new Map(
        validWarehouses.map((w: any) => [w.id, w.get({ plain: true })]),
      );
      for (const role of body.roles) {
        for (const access of role.accesses || []) {
          const invalid = (access.warehouses || []).find((wid) => {
            const w: any = warehouseById.get(wid);
            return !w || w.customerId !== access.customerId;
          });
          if (invalid) {
            throw new BadRequestException(
              'Some warehouse are not registered under the selected customer',
            );
          }
        }
      }

      await sequelize.transaction(async (t) => {
        await this.userRepository.update(id, dataUser, t);

        await this.userRoleWarehouseRepository.deleteByConditions(
          {
            userRoleId: { [Op.in]: userRoleIds },
          },
          t,
        );

        await this.userRoleRepository.deleteByConditions(
          {
            userId: id,
          },
          t,
        );

        const userId = id;
        for (const role of body.roles) {
          const payload = {
            userId,
            roleId: role.id,
            createdBy: user.tokenUserId,
          };

          const userRole = await this.userRoleRepository.create(payload, t);

          const roleWarehouseIds = (role.accesses || []).flatMap(
            (a) => a.warehouses,
          );
          for (const warehouseId of roleWarehouseIds) {
            const userRoleWarehouse = {
              userRoleId: userRole.id,
              warehouseId: warehouseId,
              createdAt: new Date(),
              createdBy: user.tokenUserId,
            };
            await this.userRoleWarehouseRepository.create(userRoleWarehouse, t);
          }
        }
      });

      await cache.delete(`tokenAccess:${id}`);

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
}
