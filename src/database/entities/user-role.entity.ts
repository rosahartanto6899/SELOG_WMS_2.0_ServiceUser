import { Optional, DataTypes, ModelDefined } from 'sequelize';
import { UserRoleAttributes } from '../attributes';
import { sequelize } from '@/utils/database.util';

type UserRoleCreationAttributes = Optional<
  UserRoleAttributes,
  'id' | 'createdBy' | 'deletedBy'
>;

const tableName = 'UserRole';

const UserRole: ModelDefined<UserRoleAttributes, UserRoleCreationAttributes> =
  sequelize.define(
    tableName,
    {
      id: {
        type: DataTypes.UUIDV4,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUIDV4,
        allowNull: false,
      },
      roleId: {
        type: DataTypes.UUIDV4,
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      createdBy: {
        type: DataTypes.UUIDV4,
        allowNull: false,
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      deletedBy: {
        type: DataTypes.UUIDV4,
        allowNull: true,
      },
    },
    {
      tableName,
      timestamps: false,
    }
  );

export { UserRole };
