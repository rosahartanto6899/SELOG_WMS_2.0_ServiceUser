interface IDataUser {
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  nrp: string;
  createdBy: string;
}

interface IDataUserRole {
  id?: string;
  userId: string;
  roleId: string;
  createdAt?: Date;
  createdBy?: string;
}

interface IDataUserRoleWarehouse {
  userRoleId: string;
  warehouseId: string;
  createdAt: Date;
  createdBy: string;
}

interface IDataPublish {
  userId: string;
  name: string;
  email: string;
  phone: string;
  roles: [];
}

export { IDataUser, IDataUserRole, IDataUserRoleWarehouse, IDataPublish };
