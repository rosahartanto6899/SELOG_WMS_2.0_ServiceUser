export interface UserLoginActivityAttributes {
  id?: string;
  userId?: string | null;
  platform?: string | null;
  ipAddress?: string | null;
  channel?: string | null;
  createdAt?: Date;
  name?: string | null;
  email?: string | null;
}
