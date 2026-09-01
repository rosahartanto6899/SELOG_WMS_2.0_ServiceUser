import { UamAttributes } from '@/database/attributes';
import { BaseTransform } from '@/shared-libs/base';
import { DateHelper } from '@/shared-libs/helpers/date.helper';

export class ByIdTransform extends BaseTransform {
  transform(uam: UamAttributes): any {
    return {
      id: uam.id,
      roleId: uam.roleId,
      menuId: uam.menuId,
      isRead: uam.canRead,
      isCreate: uam.canCreate,
      isUpdate: uam.canUpdate,
      isDelete: uam.canDelete,
      isExport: false,
      levelsId: uam?.menu?.level ?? null,
      createdAt: uam.createdAt ? DateHelper.formatDefault(uam.createdAt) : '',
      createdBy: uam.createdBy,
      updatedAt: uam.updatedAt ? DateHelper.formatDefault(uam.updatedAt) : '',
      updatedBy: uam.updatedBy,
    };
  }
}
