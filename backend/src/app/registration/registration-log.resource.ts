import type { RegistrationLog, User } from '#generated/prisma/client.js';
import type { RegistrationLog as RegistrationLogData } from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';

interface RegistrationLogWithUser extends RegistrationLog {
  user: Pick<User, 'id' | 'name'> | null;
}

export class RegistrationLogResource extends JsonResource<
  RegistrationLogWithUser,
  RegistrationLogData
> {
  transform(): RegistrationLogData {
    return {
      id: this.data.id,
      registrationId: this.data.registrationId,
      campId: this.data.campId,
      action: this.data.action,
      before: this.data.before,
      after: this.data.after,
      note: this.data.note,
      userId: this.data.userId,
      userName: this.data.user?.name ?? null,
      createdAt: this.data.createdAt.toISOString(),
    };
  }
}
