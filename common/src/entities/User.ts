import type { Camp } from './Camp';

export interface User {
  email: string;
  name: string;
  locale: string;
  camps: Camp[];
}

export type UserCreateData = Pick<User, 'email' | 'name'> & {
  password: string;
};

export type UserUpdateData = Partial<UserCreateData>;
