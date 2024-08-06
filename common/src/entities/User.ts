import { Identifiable } from './Identifiable';

export interface User extends Identifiable {
  email: string;
  name: string;
  locale: string;
  role: 'USER' | 'ADMIN';
  emailVerified: boolean;
  locked: boolean;
  createdAt: string;
}

interface UserWithPassword extends User {
  password: string;
}

export type UserCreateData = Omit<
  UserWithPassword,
  'id' | 'emailVerified' | 'createdAt'
>;

export type UserUpdateData = Partial<
  Omit<UserWithPassword, 'id' | 'createdAt'>
>;
