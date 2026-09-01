import { Optional, DataTypes, ModelDefined } from 'sequelize';
import { sequelize } from '@/utils/database.util';

import { RoleAttributes } from '../attributes/';

type RoleCreationAttributes = Optional<
  RoleAttributes,
  'id' | 'createdBy' | 'updatedBy' | 'deletedBy'
>;

const tableName = 'Role';

const Role: ModelDefined<RoleAttributes, RoleCreationAttributes> =
  sequelize.define(
    tableName,
    {
      id: {
        type: DataTypes.UUIDV4,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      createdBy: {
        type: DataTypes.STRING(100),
        allowNull: false,
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
        type: DataTypes.STRING(100),
        allowNull: true,
      },
    },
    {
      tableName,
      timestamps: true,
    }
  );

export { Role };
