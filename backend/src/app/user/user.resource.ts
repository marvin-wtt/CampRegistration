import { type User, Role } from '#generated/prisma/client.js';
import type { User as UserResourceData } from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';

type PartialUser = Pick<
  User,
  | 'id'
  | 'name'
  | 'email'
  | 'locale'
  | 'role'
  | 'emailVerified'
  | 'locked'
  | 'lastSeen'
  | 'createdAt'
> & {
  twoFactor: { confirmedAt: Date | null } | null;
};

export class UserResource extends JsonResource<PartialUser, UserResourceData> {
  transform(): UserResourceData {
    return {
      id: this.data.id,
      name: this.data.name,
      email: this.data.email,
      locale: this.data.locale,
      role: convertRole(this.data.role),
      emailVerified: this.data.emailVerified,
      twoFactorEnabled: this.data.twoFactor?.confirmedAt != null,
      locked: this.data.locked,
      lastSeen: this.data.lastSeen?.toISOString() ?? null,
      createdAt: this.data.createdAt.toISOString(),
    };
  }
}

const convertRole = (role: Role): UserResourceData['role'] => {
  switch (role) {
    case Role.ADMIN:
      return 'ADMIN';
    case Role.USER:
      return 'USER';
  }
};
