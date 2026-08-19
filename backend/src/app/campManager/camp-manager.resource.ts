import type {
  CampManager,
  Invitation,
  User,
} from '#generated/prisma/client.js';
import type {
  CampManager as CampManagerData,
  CampManagerIdentity as CampManagerIdentityData,
} from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';

export interface ManagerWithRelationships extends CampManager {
  user: User | null;
  invitation: Invitation | null;
}

export class CampManagerIdentityResource extends JsonResource<
  ManagerWithRelationships,
  CampManagerIdentityData
> {
  transform(): CampManagerIdentityData {
    return {
      id: this.data.id,
      name: this.data.user ? this.data.user.name : null,
      email: this.data.invitation
        ? this.data.invitation.email
        : (this.data.user?.email ?? ''),
    };
  }
}

export class CampManagerResource extends JsonResource<
  ManagerWithRelationships,
  CampManagerData
> {
  transform(): CampManagerData {
    return {
      ...new CampManagerIdentityResource(this.data).transform(),
      status: this.data.user ? 'ACCEPTED' : 'PENDING',
      role: this.data.role as CampManagerData['role'],
      expiresAt: this.data.expiresAt?.toISOString() ?? null,
    };
  }
}
