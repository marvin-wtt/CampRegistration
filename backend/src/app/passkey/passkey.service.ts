import {
  PasskeyChallengeType,
  type User,
  type UserPasskey,
} from '#generated/prisma/client.js';
import {
  type AuthenticationResponseJSON,
  generateAuthenticationOptions,
  generateRegistrationOptions,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
  type RegistrationResponseJSON,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import { type AppConfig } from '#config';
import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';
import { BaseService } from '#core/base/BaseService';
import { injectable } from 'inversify';
import { Config } from '#core/ioc/decorators.js';

const CHALLENGE_TTL_MS = 5 * 60 * 1000;

// One message for every login failure, so responses don't reveal whether a
// credential exists or which check rejected it.
const INVALID_PASSKEY = 'Invalid passkey';

@injectable()
export class PasskeyService extends BaseService {
  constructor(@Config() private readonly config: AppConfig) {
    super();
  }

  async generateRegistrationOptions(
    user: User,
  ): Promise<PublicKeyCredentialCreationOptionsJSON> {
    const existing = await this.prisma.userPasskey.findMany({
      where: { userId: user.id },
      select: { credentialId: true, transports: true },
    });

    const options = await generateRegistrationOptions({
      rpName: this.config.webauthn.rpName,
      rpID: this.config.webauthn.rpId,
      userName: user.email,
      userDisplayName: user.name,
      // A stable user handle lets an authenticator replace its own passkey
      // for this account instead of storing a second one.
      userID: new TextEncoder().encode(user.id),
      attestationType: 'none',
      excludeCredentials: existing.map((passkey) => ({
        id: passkey.credentialId,
        transports: passkey.transports ?? undefined,
      })),
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'required',
      },
    });

    // Only the latest registration attempt per user stays valid.
    await this.prisma.$transaction([
      this.prisma.passkeyChallenge.deleteMany({
        where: { userId: user.id, type: PasskeyChallengeType.REGISTRATION },
      }),
      this.prisma.passkeyChallenge.create({
        data: this.challengeData(
          options.challenge,
          PasskeyChallengeType.REGISTRATION,
          user.id,
        ),
      }),
    ]);

    return options;
  }

  async verifyRegistration(
    user: User,
    response: RegistrationResponseJSON,
    name: string,
  ): Promise<UserPasskey> {
    const challenge = extractChallenge(response.response.clientDataJSON);
    if (
      !challenge ||
      !(await this.consumeChallenge(
        challenge,
        PasskeyChallengeType.REGISTRATION,
        user.id,
      ))
    ) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Invalid passkey registration',
      );
    }

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: this.config.webauthn.origins,
      expectedRPID: this.config.webauthn.rpId,
      requireUserVerification: true,
    }).catch(() => ({ verified: false as const }));

    if (!verification.verified) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Invalid passkey registration',
      );
    }

    const { credential, credentialDeviceType, credentialBackedUp } =
      verification.registrationInfo;

    return this.prisma.userPasskey.create({
      data: {
        userId: user.id,
        credentialId: credential.id,
        publicKey: credential.publicKey,
        counter: credential.counter,
        transports: credential.transports,
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
        name,
      },
    });
  }

  async generateAuthenticationOptions(): Promise<PublicKeyCredentialRequestOptionsJSON> {
    // No allowCredentials: passkeys are discoverable, so the authenticator
    // offers the user's accounts itself.
    const options = await generateAuthenticationOptions({
      rpID: this.config.webauthn.rpId,
      userVerification: 'required',
    });

    await this.prisma.passkeyChallenge.create({
      data: this.challengeData(
        options.challenge,
        PasskeyChallengeType.AUTHENTICATION,
        null,
      ),
    });

    return options;
  }

  /**
   * Verify a login assertion and return the passkey's owner. Account state
   * (locked, email verification) is left to the caller, like a password login.
   */
  async verifyAuthentication(
    response: AuthenticationResponseJSON,
  ): Promise<User> {
    const challenge = extractChallenge(response.response.clientDataJSON);
    if (
      !challenge ||
      !(await this.consumeChallenge(
        challenge,
        PasskeyChallengeType.AUTHENTICATION,
        null,
      ))
    ) {
      throw new ApiError(httpStatus.UNAUTHORIZED, INVALID_PASSKEY);
    }

    const passkey = await this.prisma.userPasskey.findUnique({
      where: { credentialId: response.id },
      include: { user: true },
    });

    if (!passkey) {
      throw new ApiError(httpStatus.UNAUTHORIZED, INVALID_PASSKEY);
    }

    // Also rejects a signature counter that went backwards (a cloned
    // authenticator).
    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: this.config.webauthn.origins,
      expectedRPID: this.config.webauthn.rpId,
      credential: {
        id: passkey.credentialId,
        publicKey: passkey.publicKey,
        counter: passkey.counter,
        transports: passkey.transports ?? undefined,
      },
      requireUserVerification: true,
    }).catch(() => null);

    if (!verification?.verified) {
      throw new ApiError(httpStatus.UNAUTHORIZED, INVALID_PASSKEY);
    }

    await this.prisma.userPasskey.update({
      where: { id: passkey.id },
      data: {
        counter: verification.authenticationInfo.newCounter,
        backedUp: verification.authenticationInfo.credentialBackedUp,
        lastUsedAt: new Date(),
      },
    });

    return passkey.user;
  }

  async getPasskeysByUserId(userId: string): Promise<UserPasskey[]> {
    return this.prisma.userPasskey.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async renamePasskey(
    userId: string,
    passkeyId: string,
    name: string,
  ): Promise<UserPasskey> {
    await this.getPasskeyOrFail(userId, passkeyId);

    return this.prisma.userPasskey.update({
      where: { id: passkeyId },
      data: { name },
    });
  }

  async deletePasskey(userId: string, passkeyId: string): Promise<void> {
    const { count } = await this.prisma.userPasskey.deleteMany({
      where: { id: passkeyId, userId },
    });

    if (count === 0) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Passkey not found');
    }
  }

  async purgeExpiredChallenges(): Promise<number> {
    const { count } = await this.prisma.passkeyChallenge.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });

    return count;
  }

  private async getPasskeyOrFail(
    userId: string,
    passkeyId: string,
  ): Promise<UserPasskey> {
    const passkey = await this.prisma.userPasskey.findFirst({
      where: { id: passkeyId, userId },
    });

    if (!passkey) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Passkey not found');
    }

    return passkey;
  }

  private challengeData(
    challenge: string,
    type: PasskeyChallengeType,
    userId: string | null,
  ) {
    return {
      challenge,
      type,
      userId,
      expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS),
    };
  }

  // Single conditional delete so a challenge cannot be used twice, even by
  // concurrent requests. Runs before verification for the same reason.
  private async consumeChallenge(
    challenge: string,
    type: PasskeyChallengeType,
    userId: string | null,
  ): Promise<boolean> {
    const { count } = await this.prisma.passkeyChallenge.deleteMany({
      where: { challenge, type, userId, expiresAt: { gt: new Date() } },
    });

    return count > 0;
  }
}

/**
 * Read the challenge the browser signed from `clientDataJSON`. It is only used
 * to find the stored challenge; the library verifies it again.
 */
function extractChallenge(clientDataJSON: string): string | null {
  try {
    const clientData: unknown = JSON.parse(
      Buffer.from(clientDataJSON, 'base64url').toString('utf8'),
    );

    if (
      typeof clientData === 'object' &&
      clientData !== null &&
      'challenge' in clientData &&
      typeof clientData.challenge === 'string'
    ) {
      return clientData.challenge;
    }
  } catch {
    // Malformed client data is an invalid response, reported by the caller.
  }

  return null;
}
