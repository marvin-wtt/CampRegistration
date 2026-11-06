import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockReset } from 'vitest-mock-extended';
import type {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
  VerifiedAuthenticationResponse,
  VerifiedRegistrationResponse,
} from '@simplewebauthn/server';
import type {
  PrismaClient,
  User,
  UserPasskey,
} from '#generated/prisma/client.js';
import type { AppConfig } from '#config';
import ApiError from '#utils/ApiError';

// Hoisted above the imports, so the mock library has to be loaded here.
const { prismaMock, webauthn } = await vi.hoisted(async () => ({
  prismaMock: (await import('vitest-mock-extended')).mockDeep<PrismaClient>(),
  webauthn: {
    verifyRegistrationResponse: vi.fn(),
    verifyAuthenticationResponse: vi.fn(),
  },
}));

vi.mock('#core/database/database.client', () => ({
  default: prismaMock,
  prisma: prismaMock,
}));

// Option generation stays real; only the cryptographic verification is
// stubbed, since a valid signature needs a real authenticator.
vi.mock('@simplewebauthn/server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@simplewebauthn/server')>()),
  ...webauthn,
}));

const { PasskeyService } = await import('#app/passkey/passkey.service');

const ORIGIN = 'https://example.com';

const config = {
  webauthn: {
    rpId: 'example.com',
    rpName: 'Example',
    origins: [ORIGIN],
  },
} as AppConfig;

const user = {
  id: '01JAAAAAAAAAAAAAAAAAAAAAAA',
  name: 'Jane Doe',
  email: 'jane@example.com',
} as User;

const storedPasskey = {
  id: 'passkey-1',
  userId: user.id,
  credentialId: 'credential-1',
  publicKey: new Uint8Array([1, 2, 3]),
  counter: 4,
  transports: ['internal'],
  deviceType: 'multiDevice',
  backedUp: true,
  name: 'Laptop',
  lastUsedAt: null,
  createdAt: new Date(),
} as UserPasskey;

function clientDataJSON(challenge: string): string {
  return Buffer.from(
    JSON.stringify({
      type: 'webauthn.get',
      challenge,
      origin: ORIGIN,
    }),
  ).toString('base64url');
}

function registrationResponse(
  clientData = clientDataJSON('challenge-1'),
): RegistrationResponseJSON {
  return {
    id: 'credential-1',
    rawId: 'credential-1',
    type: 'public-key',
    clientExtensionResults: {},
    response: { clientDataJSON: clientData, attestationObject: '' },
  };
}

function authenticationResponse(
  clientData = clientDataJSON('challenge-1'),
): AuthenticationResponseJSON {
  return {
    id: 'credential-1',
    rawId: 'credential-1',
    type: 'public-key',
    clientExtensionResults: {},
    response: {
      clientDataJSON: clientData,
      authenticatorData: '',
      signature: '',
    },
  };
}

const verifiedRegistration: VerifiedRegistrationResponse = {
  verified: true,
  registrationInfo: {
    fmt: 'none',
    aaguid: '00000000-0000-0000-0000-000000000000',
    credential: {
      id: 'credential-1',
      publicKey: new Uint8Array([1, 2, 3]),
      counter: 0,
      transports: ['internal', 'hybrid'],
    },
    credentialType: 'public-key',
    attestationObject: new Uint8Array(),
    userVerified: true,
    credentialDeviceType: 'multiDevice',
    credentialBackedUp: true,
    origin: ORIGIN,
  },
};

const verifiedAuthentication: VerifiedAuthenticationResponse = {
  verified: true,
  authenticationInfo: {
    credentialID: 'credential-1',
    newCounter: 5,
    userVerified: true,
    credentialDeviceType: 'multiDevice',
    credentialBackedUp: true,
    origin: ORIGIN,
    rpID: config.webauthn.rpId,
  },
};

async function expectApiError(promise: Promise<unknown>, statusCode: number) {
  const error = await promise.catch((e: unknown) => e);
  expect(error).toBeInstanceOf(ApiError);
  expect((error as ApiError).statusCode).toBe(statusCode);
}

describe('PasskeyService', () => {
  const service = new PasskeyService(config);

  beforeEach(() => {
    mockReset(prismaMock);
    vi.clearAllMocks();
  });

  describe('generateRegistrationOptions', () => {
    it('requires a discoverable, user-verified credential', async () => {
      prismaMock.userPasskey.findMany.mockResolvedValue([]);

      const options = await service.generateRegistrationOptions(user);

      expect(options.rp).toEqual({ id: 'example.com', name: 'Example' });
      expect(options.user.name).toBe(user.email);
      expect(options.authenticatorSelection).toMatchObject({
        residentKey: 'required',
        userVerification: 'required',
      });
    });

    it("excludes the user's existing passkeys", async () => {
      prismaMock.userPasskey.findMany.mockResolvedValue([
        storedPasskey,
      ] as never);

      const options = await service.generateRegistrationOptions(user);

      expect(options.excludeCredentials).toEqual([
        expect.objectContaining({
          id: 'credential-1',
          transports: ['internal'],
        }),
      ]);
    });

    it('replaces any pending registration challenge of the user', async () => {
      prismaMock.userPasskey.findMany.mockResolvedValue([]);

      const options = await service.generateRegistrationOptions(user);

      expect(prismaMock.passkeyChallenge.deleteMany).toHaveBeenCalledWith({
        where: { userId: user.id, type: 'REGISTRATION' },
      });
      expect(prismaMock.passkeyChallenge.create).toHaveBeenCalledWith({
        data: {
          challenge: options.challenge,
          type: 'REGISTRATION',
          userId: user.id,
          expiresAt: expect.any(Date),
        },
      });
    });
  });

  describe('verifyRegistration', () => {
    it('stores the verified credential', async () => {
      prismaMock.passkeyChallenge.deleteMany.mockResolvedValue({ count: 1 });
      webauthn.verifyRegistrationResponse.mockResolvedValue(
        verifiedRegistration,
      );

      await service.verifyRegistration(user, registrationResponse(), 'Laptop');

      expect(webauthn.verifyRegistrationResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          expectedChallenge: 'challenge-1',
          expectedOrigin: [ORIGIN],
          expectedRPID: 'example.com',
          requireUserVerification: true,
        }),
      );
      expect(prismaMock.userPasskey.create).toHaveBeenCalledWith({
        data: {
          userId: user.id,
          credentialId: 'credential-1',
          publicKey: new Uint8Array([1, 2, 3]),
          counter: 0,
          transports: ['internal', 'hybrid'],
          deviceType: 'multiDevice',
          backedUp: true,
          name: 'Laptop',
        },
      });
    });

    it("consumes only the user's unexpired registration challenge", async () => {
      prismaMock.passkeyChallenge.deleteMany.mockResolvedValue({ count: 1 });
      webauthn.verifyRegistrationResponse.mockResolvedValue(
        verifiedRegistration,
      );

      await service.verifyRegistration(user, registrationResponse(), 'Laptop');

      expect(prismaMock.passkeyChallenge.deleteMany).toHaveBeenCalledWith({
        where: {
          challenge: 'challenge-1',
          type: 'REGISTRATION',
          userId: user.id,
          expiresAt: { gt: expect.any(Date) },
        },
      });
    });

    it('rejects a challenge that is unknown, expired or already used', async () => {
      prismaMock.passkeyChallenge.deleteMany.mockResolvedValue({ count: 0 });

      await expectApiError(
        service.verifyRegistration(user, registrationResponse(), 'Laptop'),
        400,
      );
      expect(webauthn.verifyRegistrationResponse).not.toHaveBeenCalled();
      expect(prismaMock.userPasskey.create).not.toHaveBeenCalled();
    });

    it('rejects malformed client data without touching challenges', async () => {
      await expectApiError(
        service.verifyRegistration(
          user,
          registrationResponse('not-json'),
          'Laptop',
        ),
        400,
      );
      expect(prismaMock.passkeyChallenge.deleteMany).not.toHaveBeenCalled();
    });

    it('rejects a response that fails verification', async () => {
      prismaMock.passkeyChallenge.deleteMany.mockResolvedValue({ count: 1 });
      webauthn.verifyRegistrationResponse.mockResolvedValue({
        verified: false,
      });

      await expectApiError(
        service.verifyRegistration(user, registrationResponse(), 'Laptop'),
        400,
      );
      expect(prismaMock.userPasskey.create).not.toHaveBeenCalled();
    });

    it('rejects a response the library throws on', async () => {
      prismaMock.passkeyChallenge.deleteMany.mockResolvedValue({ count: 1 });
      webauthn.verifyRegistrationResponse.mockRejectedValue(
        new Error('Unexpected registration response origin'),
      );

      await expectApiError(
        service.verifyRegistration(user, registrationResponse(), 'Laptop'),
        400,
      );
      expect(prismaMock.userPasskey.create).not.toHaveBeenCalled();
    });
  });

  describe('generateAuthenticationOptions', () => {
    it('stores a challenge not bound to any user', async () => {
      const options = await service.generateAuthenticationOptions();

      expect(options.rpId).toBe('example.com');
      expect(options.userVerification).toBe('required');
      expect(options.allowCredentials).toBeUndefined();
      expect(prismaMock.passkeyChallenge.create).toHaveBeenCalledWith({
        data: {
          challenge: options.challenge,
          type: 'AUTHENTICATION',
          userId: null,
          expiresAt: expect.any(Date),
        },
      });
    });
  });

  describe('verifyAuthentication', () => {
    it('verifies against the stored credential and returns its owner', async () => {
      prismaMock.passkeyChallenge.deleteMany.mockResolvedValue({ count: 1 });
      prismaMock.userPasskey.findUnique.mockResolvedValue({
        ...storedPasskey,
        user,
      } as never);
      webauthn.verifyAuthenticationResponse.mockResolvedValue(
        verifiedAuthentication,
      );

      const result = await service.verifyAuthentication(
        authenticationResponse(),
      );

      expect(result).toBe(user);
      expect(prismaMock.passkeyChallenge.deleteMany).toHaveBeenCalledWith({
        where: {
          challenge: 'challenge-1',
          type: 'AUTHENTICATION',
          userId: null,
          expiresAt: { gt: expect.any(Date) },
        },
      });
      expect(webauthn.verifyAuthenticationResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          expectedChallenge: 'challenge-1',
          requireUserVerification: true,
          credential: {
            id: 'credential-1',
            publicKey: storedPasskey.publicKey,
            counter: 4,
            transports: ['internal'],
          },
        }),
      );
    });

    it('records the new counter and last use', async () => {
      prismaMock.passkeyChallenge.deleteMany.mockResolvedValue({ count: 1 });
      prismaMock.userPasskey.findUnique.mockResolvedValue({
        ...storedPasskey,
        user,
      } as never);
      webauthn.verifyAuthenticationResponse.mockResolvedValue(
        verifiedAuthentication,
      );

      await service.verifyAuthentication(authenticationResponse());

      expect(prismaMock.userPasskey.update).toHaveBeenCalledWith({
        where: { id: 'passkey-1' },
        data: {
          counter: 5,
          backedUp: true,
          lastUsedAt: expect.any(Date),
        },
      });
    });

    it('rejects a challenge that is unknown, expired or already used', async () => {
      prismaMock.passkeyChallenge.deleteMany.mockResolvedValue({ count: 0 });

      await expectApiError(
        service.verifyAuthentication(authenticationResponse()),
        401,
      );
      expect(prismaMock.userPasskey.findUnique).not.toHaveBeenCalled();
    });

    it('rejects an unknown credential', async () => {
      prismaMock.passkeyChallenge.deleteMany.mockResolvedValue({ count: 1 });
      prismaMock.userPasskey.findUnique.mockResolvedValue(null);

      await expectApiError(
        service.verifyAuthentication(authenticationResponse()),
        401,
      );
      expect(webauthn.verifyAuthenticationResponse).not.toHaveBeenCalled();
    });

    it('rejects an assertion the library throws on, such as a counter regression', async () => {
      prismaMock.passkeyChallenge.deleteMany.mockResolvedValue({ count: 1 });
      prismaMock.userPasskey.findUnique.mockResolvedValue({
        ...storedPasskey,
        user,
      } as never);
      webauthn.verifyAuthenticationResponse.mockRejectedValue(
        new Error('Response counter value 3 was lower than expected 4'),
      );

      await expectApiError(
        service.verifyAuthentication(authenticationResponse()),
        401,
      );
      expect(prismaMock.userPasskey.update).not.toHaveBeenCalled();
    });

    it('rejects an assertion that fails verification', async () => {
      prismaMock.passkeyChallenge.deleteMany.mockResolvedValue({ count: 1 });
      prismaMock.userPasskey.findUnique.mockResolvedValue({
        ...storedPasskey,
        user,
      } as never);
      webauthn.verifyAuthenticationResponse.mockResolvedValue({
        ...verifiedAuthentication,
        verified: false,
      });

      await expectApiError(
        service.verifyAuthentication(authenticationResponse()),
        401,
      );
      expect(prismaMock.userPasskey.update).not.toHaveBeenCalled();
    });

    it('rejects malformed client data with the same error', async () => {
      await expectApiError(
        service.verifyAuthentication(authenticationResponse('not-json')),
        401,
      );
    });
  });

  describe('renamePasskey', () => {
    it("renames the user's passkey", async () => {
      prismaMock.userPasskey.findFirst.mockResolvedValue(storedPasskey);

      await service.renamePasskey(user.id, 'passkey-1', 'Phone');

      expect(prismaMock.userPasskey.findFirst).toHaveBeenCalledWith({
        where: { id: 'passkey-1', userId: user.id },
      });
      expect(prismaMock.userPasskey.update).toHaveBeenCalledWith({
        where: { id: 'passkey-1' },
        data: { name: 'Phone' },
      });
    });

    it("refuses another user's passkey", async () => {
      prismaMock.userPasskey.findFirst.mockResolvedValue(null);

      await expectApiError(
        service.renamePasskey('other-user', 'passkey-1', 'Phone'),
        404,
      );
      expect(prismaMock.userPasskey.update).not.toHaveBeenCalled();
    });
  });

  describe('deletePasskey', () => {
    it("deletes only the user's own passkey", async () => {
      prismaMock.userPasskey.deleteMany.mockResolvedValue({ count: 1 });

      await service.deletePasskey(user.id, 'passkey-1');

      expect(prismaMock.userPasskey.deleteMany).toHaveBeenCalledWith({
        where: { id: 'passkey-1', userId: user.id },
      });
    });

    it("refuses another user's passkey", async () => {
      prismaMock.userPasskey.deleteMany.mockResolvedValue({ count: 0 });

      await expectApiError(
        service.deletePasskey('other-user', 'passkey-1'),
        404,
      );
    });
  });

  describe('purgeExpiredChallenges', () => {
    it('deletes challenges past their expiry', async () => {
      prismaMock.passkeyChallenge.deleteMany.mockResolvedValue({ count: 3 });

      await expect(service.purgeExpiredChallenges()).resolves.toBe(3);
      expect(prismaMock.passkeyChallenge.deleteMany).toHaveBeenCalledWith({
        where: { expiresAt: { lt: expect.any(Date) } },
      });
    });
  });
});
