import { DataTypes, Optional, ModelDefined } from 'sequelize';
import { UamAttributes } from '../attributes/';
import { sequelize } from '@/utils/database.util';

type UamCreationAttributes = Optional<
  UamAttributes,
  'id' | 'createdAt' | 'updatedAt' | 'deletedAt'
>;

const tableName = 'Uam';

const Uam: ModelDefined<UamAttributes, UamCreationAttributes> =
  sequelize.define(
    tableName,
    {
      id: {
        type: DataTypes.UUIDV4,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      roleId: {
        type: DataTypes.UUIDV4,
        allowNull: false,
      },
      menuId: {
        type: DataTypes.UUIDV4,
        allowNull: false,
      },
      canCreate: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      canRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      canUpdate: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      canDelete: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },

      createdBy: {
        type: DataTypes.UUIDV4,
        allowNull: false,
      },

      updatedBy: {
        type: DataTypes.UUIDV4,
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
    },
    {
      tableName,
      timestamps: true,
    }
  );

export { Uam };
