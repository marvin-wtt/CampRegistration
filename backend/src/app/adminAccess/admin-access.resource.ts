import type {
  AdminAccessGrant as AdminAccessGrantData,
  AdminAccessGrantReview,
  Translatable,
} from '@camp-registration/common/entities';
import type { AdminAccessGrant, Prisma, User } from '#generated/prisma/client';
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

type ReviewInput = AdminAccessGrant & {
  user: Pick<User, 'id' | 'name' | 'email'>;
  subjectName: Prisma.JsonValue;
};

export class AdminAccessGrantReviewResource extends JsonResource<
  ReviewInput,
  AdminAccessGrantReview
> {
  transform(): AdminAccessGrantReview {
    return {
      ...new AdminAccessGrantResource(this.data).transform(),
      user: this.data.user,
      subjectName: this.data.subjectName as Translatable | null,
    };
  }
}
