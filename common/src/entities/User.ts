import { Identifiable } from './Identifiable.js';

export interface User extends Identifiable {
  email: string;
  name: string;
  locale: string;
  role: 'USER' | 'ADMIN';
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  locked: boolean;
  lastSeen: string | null;
  createdAt: string;
}

interface UserWithPassword extends User {
  password: string;
}

export type UserCreateData = Omit<
  UserWithPassword,
  'id' | 'emailVerified' | 'twoFactorEnabled' | 'lastSeen' | 'createdAt'
>;

export type UserUpdateData = Partial<
  Omit<UserWithPassword, 'id' | 'twoFactorEnabled' | 'createdAt'>
>;

export type UserStatus = 'active' | 'locked' | 'unverified';

export interface UserQuery {
  cursor?: string;
  limit?: number;
  sortBy?: keyof User;
  sortType?: 'asc' | 'desc';

  /** Free-text search across name and email. */
  search?: string;
  name?: string;
  email?: string;
  role?: User['role'];
  status?: UserStatus;
}
