import { z, type ZodType } from 'zod';
import type {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/server';
import type {
  PasskeyDeleteData,
  PasskeyRegistrationOptionsData,
  PasskeyRegistrationVerifyData,
  PasskeyUpdateData,
} from '@camp-registration/common/entities';

const base64url = z.string().regex(/^[A-Za-z0-9_-]*$/);

// Bounded by the `credential_id` column; longer IDs would fail on insert.
const credentialId = base64url.min(1).max(512);

const transports = z.array(
  z.enum(['ble', 'cable', 'hybrid', 'internal', 'nfc', 'smart-card', 'usb']),
);

const authenticatorAttachment = z.enum(['platform', 'cross-platform']);

// The library verifies the contents; this only pins the shape it expects.
const clientExtensionResults = z.object({}).loose();

const registrationResponse = z.object({
  id: credentialId,
  rawId: credentialId,
  type: z.literal('public-key'),
  response: z.object({
    clientDataJSON: base64url,
    attestationObject: base64url,
    authenticatorData: base64url.optional(),
    transports: transports.optional(),
    publicKeyAlgorithm: z.number().int().optional(),
    publicKey: base64url.optional(),
  }),
  authenticatorAttachment: authenticatorAttachment.optional(),
  clientExtensionResults,
}) satisfies ZodType<RegistrationResponseJSON>;

export const authenticationResponse = z.object({
  id: credentialId,
  rawId: credentialId,
  type: z.literal('public-key'),
  response: z.object({
    clientDataJSON: base64url,
    authenticatorData: base64url,
    signature: base64url,
    userHandle: base64url.optional(),
  }),
  authenticatorAttachment: authenticatorAttachment.optional(),
  clientExtensionResults,
}) satisfies ZodType<AuthenticationResponseJSON>;

const reauthentication = z.object({
  password: z.string(),
  // Either a 6-digit TOTP or a longer recovery code.
  otp: z.string().min(6).optional(),
});

const name = z.string().trim().min(1).max(255);

const passkeyParams = z.object({
  passkeyId: z.string(),
});

const registrationOptions = z.object({
  body: reauthentication satisfies ZodType<PasskeyRegistrationOptionsData>,
});

const registrationVerify = z.object({
  body: z.object({
    response: registrationResponse,
    name,
  }) satisfies ZodType<PasskeyRegistrationVerifyData>,
});

const update = z.object({
  params: passkeyParams,
  body: z.object({
    name,
  }) satisfies ZodType<PasskeyUpdateData>,
});

const destroy = z.object({
  params: passkeyParams,
  body: reauthentication satisfies ZodType<PasskeyDeleteData>,
});

export default {
  registrationOptions,
  registrationVerify,
  update,
  destroy,
};
