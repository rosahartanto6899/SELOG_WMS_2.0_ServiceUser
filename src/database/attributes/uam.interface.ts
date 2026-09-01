import { MenuAttributes } from './menu.interface';
import { RoleAttributes } from './role.interface';
export interface UamAttributes {
  id?: string;
  role?: RoleAttributes | null;
  menu?: MenuAttributes | null;
  roleId: string;
  menuId: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canEtc: boolean;
  createdAt?: Date;
  createdBy?: string;
  updatedAt?: Date;
  updatedBy?: string;
  deletedAt?: Date;
  deletedBy?: string;
}
