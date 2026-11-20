import type { AdminAccessGrant as AdminAccessGrantData } from '@camp-registration/common/entities';
import type { AdminAccessGrant } from '#generated/prisma/client';
import { JsonResource } from '#core/resource/JsonResource';

export class AdminAccessGrantResource extends JsonResource<
  AdminAccessGrant,
  AdminAccessGrantData
> {
  transform(): AdminAccessGrantData {
    return {
      id: this.data.id,
      scope: this.data.scope,
      scopeId: this.data.scopeId,
      reason: this.data.reason,
      expiresAt: this.data.expiresAt.toISOString(),
      endedAt: this.data.endedAt?.toISOString() ?? null,
      createdAt: this.data.createdAt.toISOString(),
    };
  }
}
