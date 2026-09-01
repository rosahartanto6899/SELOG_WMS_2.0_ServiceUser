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
  roleId?: number;
  role?: string;
  roles?: string;
  email?: string;
  customerId?: string | null;
  type: string;
}

export { ILoginAttempt, ILoginHistory, ILoginUser, IPayloadJwt };
