import { DataTypes, ModelDefined, Optional } from 'sequelize';
import { UserAttributes } from '../attributes';
import { sequelize } from '@/utils/database.util';

type UserCreationAttributes = Optional<
  UserAttributes,
  'id' | 'createdBy' | 'updatedBy' | 'deletedBy'
>;

const tableName = 'User';

const User: ModelDefined<UserAttributes, UserCreationAttributes> =
  sequelize.define(
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
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING(15),
        allowNull: true,
      },
      provider: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      asRole: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      nrp: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      password: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },

      createdBy: {
        type: DataTypes.UUIDV4,
        allowNull: true,
      },

      updatedBy: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },

      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      deletedBy: {
        type: DataTypes.UUIDV4,
        allowNull: true,
      },
      token: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
    },
    { tableName, timestamps: true },
  );

export { User };
