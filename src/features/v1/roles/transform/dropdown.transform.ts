import { RoleAttributes } from '@/database/attributes';
import { BaseTransform } from '@/shared-libs/base';
import { DateHelper } from '@/shared-libs/helpers/date.helper';

export class DropdownTransform extends BaseTransform {
  transform(role: RoleAttributes): any {
    return {
      id: role.id,
      roleName: role.name,
      roleDescription: role.description,
      createdAt: role.createdAt ? DateHelper.formatDefault(role.createdAt) : '',
      createdBy: role.createdBy,
      updatedAt: role.updatedAt ? DateHelper.formatDefault(role.updatedAt) : '',
      updatedBy: role.updatedBy,
    };
  }
}
