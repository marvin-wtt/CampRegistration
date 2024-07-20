import { Camp, User } from '@prisma/client';
import { campResource } from './index';
import type { Profile as ProfileResource } from '@camp-registration/common/entities';

export const profileResource = (
  user: Omit<User, 'password'>,
  camps: Camp[] = [],
): ProfileResource => {
  return {
    name: user.name,
    email: user.email,
    locale: user.locale,
    camps: camps.map((value) => campResource(value)),
  };
};

export default profileResource;
