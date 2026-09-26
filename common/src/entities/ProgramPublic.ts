import type { ProgramItem } from './ProgramItem.js';

/**
 * The response shape of the public, read-only program-calendar endpoint
 * (`GET /events/:eventId/program-public`).
 *
 * `enabled: false` is the master switch being off — the link itself isn't
 * reachable at all, regardless of any day's publish state.
 *
 * When `enabled` is `true`, `date`/`minDate`/`maxDate` are always present so
 * the viewer can browse to another day (including ones in the future) even
 * when the current one isn't published — `minDate`/`maxDate` are the event's
 * own date bounds. `published: false` then means specifically that `date`
 * has no plan published for it.
 */
export type ProgramPublicView =
  | { enabled: false }
  | {
      enabled: true;
      /** The day being shown, `YYYY-MM-DD`. */
      date: string;
      /** Inclusive navigation bounds — the event's own dates. */
      minDate: string;
      maxDate: string;
      published: false;
    }
  | {
      enabled: true;
      date: string;
      minDate: string;
      maxDate: string;
      published: true;
      plan: 'a' | 'b' | 'both';
      items: ProgramItem[];
    };
