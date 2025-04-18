import type { User } from '@prisma/client';
import { CampResource, type CampWithFreePlaces } from '#app/camp/camp.resource';
import type { Profile as ProfileResourceData } from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';

export interface UserWithCamps extends Omit<User, 'password'> {
  camps: CampWithFreePlaces[];
}

export class ProfileResource extends JsonResource<
  UserWithCamps,
  ProfileResourceData
> {
  transform(): ProfileResourceData {
    return {
      name: this.data.name,
      email: this.data.email,
      role: this.data.role,
      twoFactorEnabled: this.data.twoFactorEnabled,
      locale: this.data.locale,
      camps: CampResource.collection(this.data.camps).transform(),
    };
  }
}
