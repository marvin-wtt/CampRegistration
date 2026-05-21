import type { CampManager, User } from '#generated/prisma/client.js';
import type { Profile as ProfileResourceData } from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';
import { campPermissionRegistry } from '#core/permission-registry';

export interface UserWithCampRoles extends Omit<User, 'password'> {
  campRoles: CampManager[];
}

export class ProfileResource extends JsonResource<
  UserWithCampRoles,
  ProfileResourceData
> {
  transform(): ProfileResourceData {
    return {
      name: this.data.name,
      email: this.data.email,
      role: this.data.role,
      twoFactorEnabled: this.data.twoFactorEnabled,
      locale: this.data.locale,
      campAccess: this.data.campRoles.map((manager) => ({
        campId: manager.campId,
        role: manager.role,
        permissions: campPermissionRegistry.getPermissions(manager.role),
      })),
    };
  }
}
