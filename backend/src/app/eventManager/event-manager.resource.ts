import type {
  EventManager,
  Invitation,
  User,
} from '#generated/prisma/client.js';
import type {
  EventManager as EventManagerData,
  EventManagerIdentity as EventManagerIdentityData,
} from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';

export interface ManagerWithRelationships extends EventManager {
  user: User | null;
  invitation: Invitation | null;
}

export class EventManagerIdentityResource extends JsonResource<
  ManagerWithRelationships,
  EventManagerIdentityData
> {
  transform(): EventManagerIdentityData {
    return {
      id: this.data.id,
      name: this.data.user ? this.data.user.name : null,
      email: this.data.invitation
        ? this.data.invitation.email
        : (this.data.user?.email ?? ''),
    };
  }
}

export class EventManagerResource extends JsonResource<
  ManagerWithRelationships,
  EventManagerData
> {
  transform(): EventManagerData {
    return {
      ...new EventManagerIdentityResource(this.data).transform(),
      status: this.data.user ? 'ACCEPTED' : 'PENDING',
      role: this.data.role as EventManagerData['role'],
      expiresAt: this.data.expiresAt?.toISOString() ?? null,
    };
  }
}
