import { Identifiable } from './Identifiable';

export interface User extends Identifiable {
  email: string;
  name: string;
  locale: string;
  role: 'USER' | 'ADMIN';
  emailVerified: boolean;
  locked: boolean;
  lastSeen: string | null;
  createdAt: string;
}

interface UserWithPassword extends User {
  password: string;
}

export type UserCreateData = Omit<
  UserWithPassword,
  'id' | 'emailVerified' | 'lastSeen' | 'createdAt'
>;

export type UserUpdateData = Partial<
  Omit<UserWithPassword, 'id' | 'createdAt'>
>;
