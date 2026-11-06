import type { UserPasskey } from '#generated/prisma/client.js';
import type {
  Passkey,
  PasskeyCeremonyJSON,
} from '@camp-registration/common/entities';
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/server';
import { JsonResource } from '#core/resource/JsonResource';

export class PasskeyResource extends JsonResource<UserPasskey, Passkey> {
  transform(): Passkey {
    return {
      id: this.data.id,
      name: this.data.name,
      deviceType:
        this.data.deviceType === 'multiDevice' ? 'multiDevice' : 'singleDevice',
      backedUp: this.data.backedUp,
      createdAt: this.data.createdAt.toISOString(),
      lastUsedAt: this.data.lastUsedAt?.toISOString() ?? null,
    };
  }
}

export class PasskeyOptionsResource extends JsonResource<
  | PublicKeyCredentialCreationOptionsJSON
  | PublicKeyCredentialRequestOptionsJSON,
  PasskeyCeremonyJSON
> {
  transform(): PasskeyCeremonyJSON {
    return { ...this.data };
  }
}
