import { UamAttributes } from '@/database/attributes';
import { BaseTransform } from '@/shared-libs/base';
import { DateHelper } from '@/shared-libs/helpers/date.helper';

export class ByRoleTransform extends BaseTransform {
  transform(uam: UamAttributes): any {
    return {
      id: uam.id,
      isRead: uam.canRead,
      isCreate: uam.canCreate,
      isUpdate: uam.canUpdate,
      isDelete: uam.canDelete,
      isExport: false,
      fleetGroupId: null,
      levelsId: uam.menu.level,
      role: {
        id: uam.role.id,
        roleName: uam.role.name,
        description: uam.role.description,
      },
      menu: {
        id: uam.menu.id,
        menuName: uam.menu.menu,
      },
      createdAt: uam.createdAt ? DateHelper.formatDefault(uam.createdAt) : '',
      createdBy: uam.createdBy,
      updatedAt: uam.updatedAt ? DateHelper.formatDefault(uam.updatedAt) : '',
      updatedBy: uam.updatedBy,
    };
  }
}
