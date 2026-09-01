import { UserAttributes } from '@/database/attributes';
import { BaseTransform } from '@/shared-libs/base';

export class DropdownSalesTransform extends BaseTransform {
  transform(user: UserAttributes): any {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      nrp: user.nrp,
    };
  }
}
