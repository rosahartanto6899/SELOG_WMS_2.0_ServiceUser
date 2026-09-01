export interface LoginAttemptAttributes {
  id?: string;
  email: string;
  attemptCount?: number;
  banExpiresAt?: Date | null;
  userId?: string;

  createdAt?: Date;
  updatedAt?: Date;
  updatedBy?: string;
  createdBy?: string;
}
