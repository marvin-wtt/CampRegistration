import type {
  OrganizationInvitation,
  OrganizationMember,
  User,
} from '#generated/prisma/client.js';
import type { OrganizationMember as OrganizationMemberData } from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';

export interface MemberWithRelationships extends OrganizationMember {
  user: User | null;
  invitation: OrganizationInvitation | null;
}

export class OrganizationMemberResource extends JsonResource<
  MemberWithRelationships,
  OrganizationMemberData
> {
  transform(): OrganizationMemberData {
    return {
      id: this.data.id,
      name: this.data.user ? this.data.user.name : null,
      email: this.data.invitation
        ? this.data.invitation.email
        : (this.data.user?.email ?? ''),
      status: this.data.user ? 'ACCEPTED' : 'PENDING',
      role: this.data.role as OrganizationMemberData['role'],
      createdAt: this.data.createdAt.toISOString(),
    };
  }
}
