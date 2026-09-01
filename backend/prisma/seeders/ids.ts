/**
 * Fixed ids for the development seed. Stable across reseeds so a bookmarked
 * management URL keeps pointing at the same scenario.
 *
 * Crockford base32 only — `I`, `L`, `O` and `U` are not valid ULID characters.
 */
const seedId = (suffix: string) => `01K9ATF1H9KD1K6H12F3YK8${suffix}`;

/**
 * `john@example.com` is the account every scenario is built around: see
 * `README.md` for the full matrix of what he can and cannot do where.
 */
export const USER_IDS = {
  john: '01H4BK7J4WV75DZNAQBHMM99MA',
  admin: seedId('AD1'),
  erika: seedId('ER1'),
  peter: seedId('PE1'),
  maria: seedId('MA1'),
  tom: seedId('TM1'),
  locked: seedId('BK1'),
  unverified: seedId('NV1'),
} as const;

export const ORGANIZATION_IDS = {
  /** VERIFIED, John is ADMIN. Owns most of the seeded events and newsletters. */
  youthAdventures: seedId('RGZ'),
  /** VERIFIED, John is MEMBER only — no implicit access to its events. */
  alpineExplorers: seedId('MBR'),
  /** PENDING, John is ADMIN. Its events stay hidden and refuse registrations. */
  nouvelleAssociation: seedId('PND'),
  /** REJECTED, John is ADMIN. Its events were unpublished by the rejection. */
  harbourTrust: seedId('RJC'),
  /** VERIFIED, John is not a member at all. */
  coastalEvents: seedId('FRN'),
  /** PENDING, John is not a member — second entry for the moderation queue. */
  bergfreunde: seedId('PN2'),
} as const;

export const EVENT_IDS = {
  /** The flagship: every child model is seeded for this one. */
  summer: seedId('RWR'),
  files: '01JKEMXG5C62NBMA6V0QQDJ7JD',
  simple: '01JHP0CXJFR4MQS8SF1HQJCY38',
  city: seedId('CTY'),
  autumn: seedId('ATM'),
  spring: seedId('SPG'),
  winter: seedId('ARC'),
  mountainWeeks: seedId('MNT'),
  glacierTrek: seedId('GCR'),
  printemps: seedId('PRT'),
  harbourSailing: seedId('HRB'),
  seaside: seedId('SEA'),
} as const;

export const NEWSLETTER_IDS = {
  eventUpdates: seedId('NW1'),
  registrationReminders: seedId('NW2'),
  alumniDigest: seedId('NW3'),
  boardAnnouncements: seedId('NW4'),
  lettreInfo: seedId('NW5'),
  alpineNews: seedId('NW6'),
} as const;

export const SEED_PASSWORD = 'password';
export const SEED_ADMIN_PASSWORD = 'admin-password';
