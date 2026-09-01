import { UserAttributes } from '@/database/attributes';
import { BaseTransform } from '@/shared-libs/base';
import { DateHelper } from '@/shared-libs/helpers/date.helper';

export class GetAllTransform extends BaseTransform {
  transform(user: UserAttributes): any {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      nrp: user.nrp,
      roles: (user.userRoles || []).map((userRole: any) => ({
        id: userRole.role.id,
        name: userRole.role.name,
        description: userRole.role.description,
        warehouses: (userRole.warehouses || []).map((warehouse: any) => ({
          id: warehouse.warehouseId,
          name: '',
          description: '',
        })),
      })),
      createdAt: user.createdAt ? DateHelper.formatDefault(user.createdAt) : '',
      createdBy: user.createdBy,
      updatedAt: user.updatedAt ? DateHelper.formatDefault(user.updatedAt) : '',
      updatedBy: user.updatedBy,
      deletedAt: user.deletedAt ? DateHelper.formatDefault(user.deletedAt) : '',
      deletedBy: user.deletedBy,
    };
  }
}
