import {
  createHash,
  generateKeyPairSync,
  randomBytes,
  sign,
} from 'node:crypto';
import type { KeyObject } from 'node:crypto';
import config from '#config/index';

// A minimal software authenticator: produces real `none`-attestation
// registrations and ES256 assertions, so the server's WebAuthn verification
// runs unmocked.

type CborValue = number | string | Uint8Array | Map<CborValue, CborValue>;

function cborHead(major: number, length: number): Buffer {
  if (length < 24) {
    return Buffer.from([(major << 5) | length]);
  }
  if (length < 0x100) {
    return Buffer.from([(major << 5) | 24, length]);
  }
  const head = Buffer.alloc(3);
  head[0] = (major << 5) | 25;
  head.writeUInt16BE(length, 1);
  return head;
}

function cbor(value: CborValue): Buffer {
  if (typeof value === 'number') {
    return value >= 0 ? cborHead(0, value) : cborHead(1, -1 - value);
  }
  if (typeof value === 'string') {
    const bytes = Buffer.from(value, 'utf8');
    return Buffer.concat([cborHead(3, bytes.length), bytes]);
  }
  if (value instanceof Uint8Array) {
    return Buffer.concat([cborHead(2, value.length), value]);
  }
  return Buffer.concat([
    cborHead(5, value.size),
    ...[...value].flatMap(([key, item]) => [cbor(key), cbor(item)]),
  ]);
}

const sha256 = (data: Buffer | string) =>
  createHash('sha256').update(data).digest();

const b64url = (data: Buffer | Uint8Array) =>
  Buffer.from(data).toString('base64url');

// Flags: UP (user present) | UV (user verified), plus AT (attested data).
const FLAG_UP = 0x01;
const FLAG_UV = 0x04;
const FLAG_AT = 0x40;

interface CeremonyOptions {
  challenge: string;
  origin?: string;
  rpId?: string;
  userVerified?: boolean;
}

export class SoftwareAuthenticator {
  readonly credentialId = randomBytes(32);
  private readonly privateKey: KeyObject;
  private readonly publicKey: KeyObject;
  private counter = 0;

  constructor() {
    const { privateKey, publicKey } = generateKeyPairSync('ec', {
      namedCurve: 'P-256',
    });
    this.privateKey = privateKey;
    this.publicKey = publicKey;
  }

  get id(): string {
    return b64url(this.credentialId);
  }

  register({
    challenge,
    origin = config.webauthn.origins[0],
    rpId = config.webauthn.rpId,
    userVerified = true,
  }: CeremonyOptions) {
    const jwk = this.publicKey.export({ format: 'jwk' });
    const cosePublicKey = new Map<CborValue, CborValue>([
      [1, 2], // kty: EC2
      [3, -7], // alg: ES256
      [-1, 1], // crv: P-256
      [-2, Buffer.from(jwk.x as string, 'base64url')],
      [-3, Buffer.from(jwk.y as string, 'base64url')],
    ]);

    const credentialIdLength = Buffer.alloc(2);
    credentialIdLength.writeUInt16BE(this.credentialId.length);

    const authData = Buffer.concat([
      this.authenticatorData(rpId, FLAG_AT | this.flags(userVerified)),
      Buffer.alloc(16), // AAGUID
      credentialIdLength,
      this.credentialId,
      cbor(cosePublicKey),
    ]);

    const attestationObject = cbor(
      new Map<CborValue, CborValue>([
        ['fmt', 'none'],
        ['attStmt', new Map()],
        ['authData', authData],
      ]),
    );

    return {
      id: this.id,
      rawId: this.id,
      type: 'public-key' as const,
      response: {
        clientDataJSON: b64url(
          this.clientData('webauthn.create', challenge, origin),
        ),
        attestationObject: b64url(attestationObject),
        transports: ['internal' as const],
      },
      clientExtensionResults: {},
    };
  }

  authenticate(
    {
      challenge,
      origin = config.webauthn.origins[0],
      rpId = config.webauthn.rpId,
      userVerified = true,
    }: CeremonyOptions,
    userHandle?: string,
  ) {
    this.counter += 1;

    const authenticatorData = this.authenticatorData(
      rpId,
      this.flags(userVerified),
    );
    const clientDataJSON = this.clientData('webauthn.get', challenge, origin);
    const signature = sign(
      'sha256',
      Buffer.concat([authenticatorData, sha256(clientDataJSON)]),
      this.privateKey,
    );

    return {
      id: this.id,
      rawId: this.id,
      type: 'public-key' as const,
      response: {
        clientDataJSON: b64url(clientDataJSON),
        authenticatorData: b64url(authenticatorData),
        signature: b64url(signature),
        ...(userHandle
          ? { userHandle: b64url(Buffer.from(userHandle, 'utf8')) }
          : {}),
      },
      clientExtensionResults: {},
    };
  }

  /** Rewind the signature counter, as a cloned authenticator would. */
  rewindCounter() {
    this.counter = 0;
  }

  private flags(userVerified: boolean) {
    return FLAG_UP | (userVerified ? FLAG_UV : 0);
  }

  private authenticatorData(rpId: string, flags: number): Buffer {
    const counter = Buffer.alloc(4);
    counter.writeUInt32BE(this.counter);

    return Buffer.concat([sha256(rpId), Buffer.from([flags]), counter]);
  }

  private clientData(type: string, challenge: string, origin: string) {
    return Buffer.from(
      JSON.stringify({ type, challenge, origin, crossOrigin: false }),
    );
  }
}
