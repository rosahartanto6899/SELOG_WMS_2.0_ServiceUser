import { UserAttributes } from '@/database/attributes';
import { BaseTransform } from '@/shared-libs/base';
import { DateHelper } from '@/shared-libs/helpers/date.helper';

/** Group flat UserRoleWarehouse rows into accesses[{customerId, warehouses[]}]. */
function groupAccesses(warehouses: any[]): any[] {
  const byCustomer = new Map<string, Set<string>>();
  (warehouses || []).forEach((w: any) => {
    const customerId = w?.warehouse?.customerId;
    if (!customerId) return;
    if (!byCustomer.has(customerId)) byCustomer.set(customerId, new Set());
    byCustomer.get(customerId).add(w.warehouseId);
  });
  return Array.from(byCustomer.entries()).map(([customerId, ids]) => ({
    customerId,
    warehouses: Array.from(ids),
  }));
}

export class ByIdTransform extends BaseTransform {
  transform(user: UserAttributes): any {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      name: user.name,
      nrp: user.nrp,
      isActive: user.isActive,
      roles: (user.userRoles || []).map((userRole: any) => ({
        id: userRole.role.id,
        name: userRole.role.name,
        description: userRole.role.description,
        accesses: groupAccesses(userRole.warehouses),
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
