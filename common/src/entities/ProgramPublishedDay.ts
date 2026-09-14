/**
 * A single day published on the public program link
 * (`SETTING_KEYS.PROGRAM_PUBLIC` governs the master switch; each published
 * day is its own row so publishing/unpublishing one day never clobbers
 * another's concurrent change). Managed via
 * `/events/:eventId/program-public/days`.
 */
export interface ProgramPublishedDay {
  id: string;
  eventId: string;
  /** `YYYY-MM-DD`. */
  date: string;
  plan: 'a' | 'b' | 'both';
}
