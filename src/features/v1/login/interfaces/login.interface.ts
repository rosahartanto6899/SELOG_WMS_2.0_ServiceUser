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

// JWT access bersifat stateless (tanpa cache/Redis) — identitas
// (role, roles, menus, email) dibawa di klaim. Konsekuensi: token tidak bisa
// dicabut sebelum expired (logout = client buang token) dan klaim menus
// memperbesar token. Kalau perlu revocable, blacklist via DB per jti.

export { ILoginAttempt, ILoginHistory, ILoginUser, IPayloadJwt };
