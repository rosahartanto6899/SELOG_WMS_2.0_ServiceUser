export * from './user.entity';
export * from './login-history.entity';
export * from './login-attempt.entity';
export * from './menu.entity';
export * from './role.entity';
export * from './uam.entity';
export * from './user-role.entity';
export * from './user-role-branch.entity';
export * from './customer.entity';
export * from './warehouse.entity';
export * from './user-role-warehouse.entity';
export * from './user-login-activity.entity';

import { setupAssociations } from './associations';
setupAssociations();
