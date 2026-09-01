import { UamAttributes } from '@/database/attributes';
import { BaseTransform } from '@/shared-libs/base';
import { DateHelper } from '@/shared-libs/helpers/date.helper';

export class UpdateByIdTransform extends BaseTransform {
  transform(uam: UamAttributes): any {
    return {
      id: uam.id,
      roleId: uam.role.id,
      menuId: uam.menu.id,
      isRead: uam.canRead,
      isCreate: uam.canCreate,
      isUpdate: uam.canUpdate,
      isDelete: uam.canDelete,
      isExport: false,
      fleetGroupId: null,
      levelsId: uam.menu.level,
      createdAt: uam.createdAt ? DateHelper.formatDefault(uam.createdAt) : '',
      createdBy: uam.createdBy,
      updatedAt: uam.updatedAt ? DateHelper.formatDefault(uam.updatedAt) : '',
      updatedBy: uam.updatedBy,
    };
  }
}
