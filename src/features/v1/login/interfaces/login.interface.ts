import { UserAttributes } from '@/database/attributes';

interface ILoginAttempt {
  email: any;
  attemptCount: number;
  banExpiresAt?: string;
  createdAt?: string;
  updatedAt?: string;
  user: UserAttributes;
}

interface ILoginUser {
  asRole: string;
  updatedBy: string;
}

interface ILoginHistory {
  userId: string;
  email: any;
  asRole: string;
  createdBy: string;
}

interface IPayloadJwt {
  sub: string;
  iss: string;
  roleId?: string;
  role?: string;
  roles?: any[];
  name?: string;
  menus?: any[];
  email?: string;
  customerCode?: string | null;
  customerName?: string | null;
  warehouses?: { warehouseCode: string; warehouseName: string | null }[];
  customerId?: string | null;
  type: string;
}

export { ILoginAttempt, ILoginHistory, ILoginUser, IPayloadJwt };
