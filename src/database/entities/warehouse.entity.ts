import { Optional, DataTypes, ModelDefined } from 'sequelize';
import { WarehouseAttributes } from '../attributes';
import { sequelize } from '@/utils/database.util';

type WarehouseCreationAttributes = Optional<WarehouseAttributes, 'id'>;

const tableName = 'Warehouse';

const Warehouse: ModelDefined<
  WarehouseAttributes,
  WarehouseCreationAttributes
> = sequelize.define(
  tableName,
  {
    id: {
      type: DataTypes.UUIDV4,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      field: 'ID',
    },
    customerId: { type: DataTypes.UUIDV4, field: 'CustomerId' },
    code: { type: DataTypes.STRING(50), field: 'Code' },
    name: { type: DataTypes.STRING(75), field: 'Name' },
    address: { type: DataTypes.STRING(200), field: 'Address' },
    phone: { type: DataTypes.STRING(50), field: 'Phone' },
    createdAt: { type: DataTypes.DATE, field: 'CreatedAt' },
    createdBy: { type: DataTypes.STRING(100), field: 'CreatedBy' },
    updatedAt: { type: DataTypes.DATE, field: 'UpdatedAt' },
    updatedBy: { type: DataTypes.STRING(100), field: 'UpdatedBy' },
    deletedAt: { type: DataTypes.DATE, field: 'DeletedAt' },
    deletedBy: { type: DataTypes.STRING(100), field: 'DeletedBy' },
  },
  { tableName, timestamps: false }
);

export { Warehouse };
