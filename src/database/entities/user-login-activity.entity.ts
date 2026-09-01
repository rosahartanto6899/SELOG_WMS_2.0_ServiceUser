import { DataTypes, Optional, ModelDefined } from 'sequelize';
import { UserLoginActivityAttributes } from '../attributes/';
import { sequelize } from '@/utils/database.util';

type UserLoginActivityCreationAttributes = Optional<
  UserLoginActivityAttributes,
  'id'
>;

const tableName = 'UserLoginActivity';

const UserLoginActivity: ModelDefined<
  UserLoginActivityAttributes,
  UserLoginActivityCreationAttributes
> = sequelize.define(
  tableName,
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    platform: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.STRING(40),
      allowNull: true,
    },
    channel: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName,
    timestamps: false,
  }
);

export { UserLoginActivity };
