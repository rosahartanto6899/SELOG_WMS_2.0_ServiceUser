export interface CustomerAttributes {
  id?: string;
  code?: string;
  name?: string;
  address?: string;
  phone?: string;
  createdAt?: Date;
  createdBy?: string;
  updatedAt?: Date;
  updatedBy?: string;
  deletedAt?: Date;
  deletedBy?: string;

  warehouses?: WarehouseAttributes[];
}

export interface WarehouseAttributes {
  id?: string;
  customerId?: string;
  code?: string;
  name?: string;
  address?: string;
  phone?: string;
  createdAt?: Date;
  createdBy?: string;
  updatedAt?: Date;
  updatedBy?: string;
  deletedAt?: Date;
  deletedBy?: string;

  customer?: CustomerAttributes;
}

export interface UserRoleWarehouseAttributes {
  id?: string;
  userRoleId: string;
  warehouseId: string;
  createdAt?: Date;
  createdBy?: string;
  updatedAt?: Date;
  updatedBy?: string;
  deletedAt?: Date;
  deletedBy?: string;

  warehouse?: WarehouseAttributes;
}
