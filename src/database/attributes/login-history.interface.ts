export interface LoginHistoryAttributes {
  id?: string;
  email: string;
  userId: string;
  asRole: string;
  createdAt?: Date;
  createdBy?: string | null;
}
