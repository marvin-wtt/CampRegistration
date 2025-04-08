import { type User, Role } from '@prisma/client';
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
>;

export class UserResource extends JsonResource<PartialUser, UserResourceData> {
  transform(): UserResourceData {
    return {
      id: this.data.id,
      name: this.data.name,
      email: this.data.email,
      locale: this.data.locale,
      role: convertRole(this.data.role),
      emailVerified: this.data.emailVerified,
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
