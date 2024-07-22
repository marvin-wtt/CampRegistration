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

export type UserCreateData = Omit<
  User,
  'id' | 'emailVerified' | 'createdAt'
> & {
  password: string;
};

export type UserUpdateData = Partial<UserCreateData>;
