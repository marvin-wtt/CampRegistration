import { Identifiable } from './Identifiable';

export interface User extends Identifiable {
  email: string;
  name: string;
  locale: string;
  role: string;
}

export type UserCreateData = Omit<User, 'id' | 'camps'> & {
  password: string;
};

export type UserUpdateData = Partial<UserCreateData>;
