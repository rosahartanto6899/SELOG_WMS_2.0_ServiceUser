import { LoginAttempt } from './login-attempt.entity';
import { LoginHistory } from './login-history.entity';
import { Menu } from './menu.entity';
import { Role } from './role.entity';
import { Uam } from './uam.entity';
import { UserRoleBranch } from './user-role-branch.entity';
import { UserRole } from './user-role.entity';
import { User } from './user.entity';
import { UserLoginActivity } from './user-login-activity.entity';
import { Customer } from './customer.entity';
import { Warehouse } from './warehouse.entity';
import { UserRoleWarehouse } from './user-role-warehouse.entity';

export function setupAssociations() {
  User.hasMany(UserRole, { foreignKey: 'userId', as: 'userRoles' });
  UserRoleBranch.belongsTo(UserRole, {
    foreignKey: 'userRoleId',
    as: 'userRole',
  });

  LoginAttempt.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  LoginHistory.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  UserLoginActivity.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  UserRole.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  UserRole.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });
  UserRole.hasMany(UserRoleBranch, {
    foreignKey: 'userRoleId',
    as: 'branches',
  });

  Uam.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });
  Uam.belongsTo(Menu, { foreignKey: 'menuId', as: 'menu' });

  Role.hasMany(UserRole, { foreignKey: 'roleId', as: 'userRoles' });
  Role.hasMany(Uam, { foreignKey: 'roleId', as: 'uams' });

  Menu.belongsTo(Menu, { foreignKey: 'parentId', as: 'parent' });
  Menu.hasMany(Menu, { foreignKey: 'parentId', as: 'children' });
  Menu.hasMany(Uam, { foreignKey: 'menuId', as: 'uams' });

  // Customer / Warehouse (branch replacement)
  Customer.hasMany(Warehouse, {
    foreignKey: 'CustomerId',
    as: 'warehouses',
  });
  Warehouse.belongsTo(Customer, {
    foreignKey: 'CustomerId',
    as: 'customer',
  });

  UserRole.hasMany(UserRoleWarehouse, {
    foreignKey: 'UserRoleId',
    as: 'warehouses',
  });
  UserRoleWarehouse.belongsTo(UserRole, {
    foreignKey: 'UserRoleId',
    as: 'userRole',
  });
  Warehouse.hasMany(UserRoleWarehouse, {
    foreignKey: 'WarehouseId',
    as: 'userRoleWarehouses',
  });
  UserRoleWarehouse.belongsTo(Warehouse, {
    foreignKey: 'WarehouseId',
    as: 'warehouse',
  });
}
