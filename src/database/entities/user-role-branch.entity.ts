import { Optional, DataTypes, ModelDefined } from 'sequelize';
import { UserRoleBranchAttributes } from '../attributes';
import { sequelize } from '@/utils/database.util';

type UserRoleBranchCreationAttributes = Optional<
  UserRoleBranchAttributes,
  'id' | 'createdBy' | 'deletedBy'
>;

const tableName = 'UserRoleBranch';

const UserRoleBranch: ModelDefined<
  UserRoleBranchAttributes,
  UserRoleBranchCreationAttributes
> = sequelize.define(
  tableName,
  {
    id: {
      type: DataTypes.UUIDV4,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    userRoleId: {
      type: DataTypes.UUIDV4,
      allowNull: false,
    },
    branchId: {
      type: DataTypes.STRING(15),
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName,
    timestamps: false,
  }
);

export { UserRoleBranch };
