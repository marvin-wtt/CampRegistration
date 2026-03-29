import type {
  CampManager,
  Invitation,
  User,
} from '#/generated/prisma/client.js';
import type { CampManager as CampManagerData } from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';

export interface ManagerWithRelationships extends CampManager {
  user: User | null;
  invitation: Invitation | null;
}

export class ManagerResource extends JsonResource<
  ManagerWithRelationships,
  CampManagerData
> {
  transform(): CampManagerData {
    return {
      id: this.data.id,
      name: this.data.user ? this.data.user.name : null,
      email: this.data.invitation
        ? this.data.invitation.email
        : (this.data.user?.email ?? ''),
      status: this.data.user ? 'accepted' : 'pending',
      role: this.data.role,
      expiresAt: this.data.expiresAt?.toISOString() ?? null,
    };
  }
}
