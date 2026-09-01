import { RoleAttributes } from '@/database/attributes';
import { BaseTransform } from '@/shared-libs/base';
import { DateHelper } from '@/shared-libs/helpers/date.helper';

export class GetAllTransform extends BaseTransform {
  transform(role: RoleAttributes): any {
    return {
      id: role.id,
      roleName: role.name,
      roleDescription: role.description,
      numberOfUsers: 0,
      createdAt: role.createdAt ? DateHelper.formatDefault(role.createdAt) : '',
      createdBy: role.createdBy,
      updatedAt: role.updatedAt ? DateHelper.formatDefault(role.updatedAt) : '',
      updatedBy: role.updatedBy,
      deletedAt: role.deletedAt ? DateHelper.formatDefault(role.deletedAt) : '',
      deletedBy: role.deletedBy,
    };
  }
}
