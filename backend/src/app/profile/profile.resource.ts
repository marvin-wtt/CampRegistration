import { Camp, User } from '@prisma/client';
import { CampResource } from '#app/camp/camp.resource';
import type {
  Profile,
  Profile as ProfileResourceData,
} from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource.js';
import { undefined } from 'zod';

interface Profile {
  user: Omit<User, 'password'>;
  camps: Camp[];
}

export const profileResource = (
  user: Omit<User, 'password'>,
  camps: Camp[] = [],
): ProfileResourceData => {
  return {
    name: user.name,
    email: user.email,
    role: user.role,
    twoFactorEnabled: user.twoFactorEnabled,
    locale: user.locale,
    camps: CampResource.collection(camps).transform(),
  };
};

export class ProfileResource extends JsonResource<
  Profile,
  ProfileResourceData
> {
  transform(): ProfileResourceData {
    return {
      name: this.data.user.name,
      email: this.data.user.email,
      role: this.data.user.role,
      twoFactorEnabled: this.data.user.twoFactorEnabled,
      locale: this.data.user.locale,
      camps: CampResource.collection(this.data.camps).transform(),
    };
  }
}

export default profileResource;
