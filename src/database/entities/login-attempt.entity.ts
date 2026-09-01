import { DataTypes, Optional, ModelDefined } from 'sequelize';
import { LoginAttemptAttributes } from '../attributes/';
import { sequelize } from '@/utils/database.util';
import { User } from './';

type LoginAttemptCreationAttributes = Optional<
  LoginAttemptAttributes,
  'id' | 'updatedBy' | 'createdBy' | 'attemptCount' | 'banExpiresAt' | 'userId'
>;

const tableName = 'LoginAttempt';

const LoginAttempt: ModelDefined<
  LoginAttemptAttributes,
  LoginAttemptCreationAttributes
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
    attemptCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    banExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    userId: {
      type: DataTypes.UUIDV4,
      allowNull: true,
      references: {
        model: User,
        key: 'id',
      },
    },
    createdBy: {
      type: DataTypes.UUIDV4,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
    updatedBy: {
      type: DataTypes.UUIDV4,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
  },
  {
    tableName,
    timestamps: true,
  }
);

export { LoginAttempt };
