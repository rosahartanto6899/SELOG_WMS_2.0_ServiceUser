import { DataTypes, Optional, ModelDefined } from 'sequelize';
import { LoginHistoryAttributes } from '../attributes/';
import { sequelize } from '@/utils/database.util';

type LoginHistoryCreationAttributes = Optional<
  LoginHistoryAttributes,
  'id' | 'createdBy'
>;

const tableName = 'LoginHistory';

const LoginHistory: ModelDefined<
  LoginHistoryAttributes,
  LoginHistoryCreationAttributes
> = sequelize.define(
  tableName,
  {
    id: {
      type: DataTypes.UUIDV4,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    asRole: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    createdBy: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    userId: {
      type: DataTypes.UUIDV4,
      allowNull: false,
    },
  },
  {
    tableName,
    timestamps: false,
  }
);

export { LoginHistory };
