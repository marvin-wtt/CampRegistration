# Passkeys as an additional login

Users can register passkeys (WebAuthn credentials) from their security settings
and sign in with one instead of password + TOTP. Passwords stay mandatory —
registration, reset-password and setup are unchanged.

## Decisions

1. **Library:** `@simplewebauthn/server` (backend) and `@simplewebauthn/browser`
   (frontend).
2. **A passkey login skips TOTP.** We require `userVerification: 'required'`, so
   the authenticator already performed a second factor (PIN/biometric). The
   `locked` and `emailVerified` checks still apply.
3. **Challenges live in the database, not Redis.** `REDIS_HOST` is optional and
   queues/realtime are driver-based, so login must not depend on Redis. Challenges
   are single-use with a 5-minute TTL; a croner job purges expired rows. A signed
   JWT (like the TOTP partial-auth token) is not enough: it cannot be consumed, so
   it could be replayed.
4. **Re-authentication mirrors TOTP.** Adding or removing a passkey requires
   `password` (+ `otp` when TOTP is enabled), exactly like `totp.validation.ts`
   `disable`.
5. **Discoverable credentials** (`residentKey: 'required'`), so login needs no
   email and the browser can offer passkeys in the login form's autofill
   (conditional UI).
6. **The RP ID is frozen.** It is derived from `APP_URL`'s hostname, with an
   optional `WEBAUTHN_RP_ID` override. Every passkey is bound to it — renaming the
   domain invalidates all of them, the same way the encryption identifiers must
   never follow a rename.

## Phase 1 — Schema

```prisma
model UserPasskey {
  id           String    @id @default(ulid()) @db.Char(26)
  userId       String    @map("user_id") @db.Char(26)
  credentialId String    @unique @map("credential_id") @db.VarChar(512) // base64url
  publicKey    Bytes     @map("public_key")
  counter      Int       @default(0) // many synced passkeys always report 0
  transports   Json?
  deviceType   String    @map("device_type") @db.VarChar(32) // singleDevice | multiDevice
  backedUp     Boolean   @map("backed_up")
  name         String    @db.VarChar(255)
  lastUsedAt   DateTime? @map("last_used_at")
  createdAt    DateTime  @default(now()) @map("created_at")
}

model PasskeyChallenge {
  id        String               @id @default(ulid()) @db.Char(26)
  challenge String               @db.VarChar(255)
  type      PasskeyChallengeType // REGISTRATION | AUTHENTICATION
  userId    String?              @map("user_id") @db.Char(26) // registration only
  expiresAt DateTime             @map("expires_at")
}
```

Additive only — two new tables, no backfill. `credentialId` is `VARCHAR(512)` so
the unique index stays under InnoDB's 3072-byte key limit in utf8mb4 while leaving
room for long credential IDs.

## Phase 2 — Backend `passkey` module

Same layout as `totp/`: `passkey.module.ts`, `.routes.ts`, `.controller.ts`,
`.service.ts`, `.validation.ts`, `.resource.ts`; registered in `modules.ts`.

**Config** (`auth.schema.ts`): `WEBAUTHN_RP_ID` (optional, defaults to the
`APP_URL` host), `WEBAUTHN_RP_NAME` (defaults to `appName`) and
`WEBAUTHN_ORIGINS` (comma-separated, defaults to the `APP_URL` origin). Set
`WEBAUTHN_ORIGINS` whenever the frontend is served from another origin than
`APP_URL` — e.g. the Quasar dev server — or every ceremony fails the origin
check.

**`PasskeyService`**

- `generateRegistrationOptions(user)` — excludes existing credentials, stores a
  challenge
- `verifyRegistration(user, response, name)` — consumes the challenge (delete
  before verify, so it cannot race), saves the credential
- `generateAuthenticationOptions()` — no user, stores a challenge
- `verifyAuthentication(response)` — consumes the challenge, looks up by
  `credentialId`, verifies, updates `counter` and `lastUsedAt`, returns the user
- `list` / `rename` / `delete`, scoped to the owning user
- `purgeExpiredChallenges()` — scheduler job

**Routes**

| Route                                 | Guards                  | Purpose                                  |
| ------------------------------------- | ----------------------- | ---------------------------------------- |
| `POST /auth/passkey/options`          | `authLimiter`           | Login challenge                          |
| `POST /auth/passkey/verify`           | `authLimiter`           | Verify → `sendAuthResponse` (`remember`) |
| `POST /passkeys/registration/options` | `auth()`, `authLimiter` | Body: `password` (+ `otp`)               |
| `POST /passkeys/registration/verify`  | `auth()`, `authLimiter` | Body: `response`, `name`                 |
| `GET /passkeys`                       | `auth()`                | List                                     |
| `PATCH /passkeys/:passkeyId`          | `auth()`                | Rename                                   |
| `DELETE /passkeys/:passkeyId`         | `auth()`, `authLimiter` | Body: `password` (+ `otp`)               |

**`AuthController.loginWithPasskey`** reuses `sendAuthResponse` and the
`EMAIL_NOT_VERIFIED` partial-auth branch from `login` (extract it into a helper).
A `locked` user gets the same error as a password login. All verification
failures return one generic 401, so responses don't reveal which credentials
exist.

**Shared types** go in `common/entities`, like `TotpSetupData`.

## Phase 3 — Frontend

- `services/PasskeyService.ts` and `stores/passkey-store.ts`, following the TOTP
  ones
- `LoginPage.vue`: a "Sign in with passkey" `<m-btn>`, plus
  `autocomplete="username webauthn"` on the email field and conditional mediation
  (`startAuthentication({ useBrowserAutofill: true })`) on mount; hidden when
  `browserSupportsWebAuthn()` is false
- `auth-store.ts`: the passkey login result goes through the same post-login
  handling as `verifyOTP`
- `SecuritySettingsPage.vue`: a Passkeys section listing name, created and last
  used, with rename and delete; an "Add passkey" dialog that asks for password
  (+ OTP), runs the browser prompt, then asks for a name (pre-filled from the
  browser/OS hint)
- A cancelled browser prompt (`NotAllowedError`) is silent — no error toast
- Translation keys in all 5 locales

## Phase 4 — Tests

- **Unit** (`PasskeyService`): mock `@simplewebauthn/server`'s `verify*`. Cover
  expired, consumed and wrong-type challenges, an unknown credential, and a
  credential owned by another user (rename/delete).
- **Integration**: a full register → login round-trip against the real DB. A
  small software authenticator in `tests/integration/app/utils/passkey.ts`
  generates real attestation/assertion responses, so verification isn't mocked.
  Also cover TOTP being skipped, `locked` users, unverified email →
  `PARTIAL_AUTH`, and re-auth on add/delete.
- **E2E** (`passkey.spec.ts`): Chromium's CDP virtual authenticator
  (`WebAuthn.addVirtualAuthenticator`). `test.skip` when not Chromium — this
  covers desktop Chrome and Pixel 7; Firefox, WebKit and iPhone skip. Flow: add a
  passkey in settings → log out → sign in with it → dashboard.

## Order and size

1. Schema + service + unit tests (~1 day)
2. Routes/controller + integration tests (~0.5–1 day)
3. Frontend: settings, then login (~1 day)
4. E2E + i18n polish (~0.5 day)

The login button can stay hidden until a user has a passkey, so each phase can
ship on its own.

## Open questions

- **Native client:** is there a client behind the `X-Client-Type` CSRF exemption?
  If so, it needs `/.well-known/assetlinks.json` and
  `apple-app-site-association`. Web-only needs nothing more.
- **Notification email** when a passkey is added — cheap with the existing mail
  queue; recommended.
- **Admin view** of passkey counts or revocation in user management — defer.
