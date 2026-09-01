export interface UserAttributes {
  id?: string;
  email?: string;
  name?: string;
  isActive?: boolean;
  token?: string;
  phone?: string;
  nrp?: string;

  userRoles?: any[];

  asRole?: string;

  createdAt?: Date;
  createdBy?: string | null;
  updatedAt?: Date | null;
  updatedBy?: string | null;
  deletedAt?: Date | null;
  deletedBy?: string | null;
}
