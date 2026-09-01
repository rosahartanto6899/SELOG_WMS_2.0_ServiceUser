import { Optional, DataTypes, ModelDefined } from 'sequelize';
import { UserRoleWarehouseAttributes } from '../attributes';
import { sequelize } from '@/utils/database.util';

type UserRoleWarehouseCreationAttributes = Optional<
  UserRoleWarehouseAttributes,
  'id'
>;

const tableName = 'UserRoleWarehouse';

const UserRoleWarehouse: ModelDefined<
  UserRoleWarehouseAttributes,
  UserRoleWarehouseCreationAttributes
> = sequelize.define(
  tableName,
  {
    id: {
      type: DataTypes.UUIDV4,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      field: 'ID',
    },
    userRoleId: {
      type: DataTypes.UUIDV4,
      allowNull: false,
      field: 'UserRoleId',
    },
    warehouseId: {
      type: DataTypes.UUIDV4,
      allowNull: false,
      field: 'WarehouseId',
    },
    createdAt: { type: DataTypes.DATE, field: 'CreatedAt' },
    createdBy: { type: DataTypes.STRING(100), field: 'CreatedBy' },
    updatedAt: { type: DataTypes.DATE, field: 'UpdatedAt' },
    updatedBy: { type: DataTypes.STRING(100), field: 'UpdatedBy' },
    deletedAt: { type: DataTypes.DATE, field: 'DeletedAt' },
    deletedBy: { type: DataTypes.STRING(100), field: 'DeletedBy' },
  },
  { tableName, timestamps: false }
);

export { UserRoleWarehouse };
