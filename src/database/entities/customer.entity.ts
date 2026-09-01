import { Optional, DataTypes, ModelDefined } from 'sequelize';
import { CustomerAttributes } from '../attributes';
import { sequelize } from '@/utils/database.util';

type CustomerCreationAttributes = Optional<CustomerAttributes, 'id'>;

const tableName = 'Customer';

const Customer: ModelDefined<CustomerAttributes, CustomerCreationAttributes> =
  sequelize.define(
    tableName,
    {
      id: {
        type: DataTypes.UUIDV4,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        field: 'ID',
      },
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

export { Customer };
