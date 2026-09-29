import type {
  Chore,
  ChoreAssignment,
  Translatable,
} from '@camp-registration/common/entities';
import { openPrintIframe } from '@/utils/printIframe';
import { addDays } from '@/utils/date';
import { eachDate } from '@/utils/chores';

export interface PrintChoreRosterPage {
  start: string;
  days: number;
}

export interface PrintChoreRosterPayload {
  eventName: Translatable;
  // The event's languages, primary first: the roster is printed in all of them.
  locales: string[];
  pages: PrintChoreRosterPage[];
  chores: Chore[];
  assignments: ChoreAssignment[];
  // Registration id → display name, resolved by the opener.
  names: [string, string][];
}

// Landscape A4 fits ten day columns next to the chore names.
export const MAX_DAYS_PER_PAGE = 10;

/**
 * Splits the range into as few pages as fit, as evenly as possible — a
 * fortnight prints as 7 + 7 days, not 10 + 4. Pages follow the event, not
 * calendar weeks.
 */
export function rosterPages(from: string, to: string): PrintChoreRosterPage[] {
  const total = from <= to ? eachDate(from, to).length : 0;
  if (total === 0) {
    return [];
  }
  const count = Math.ceil(total / MAX_DAYS_PER_PAGE);
  const base = Math.floor(total / count);
  const longer = total % count;

  const pages: PrintChoreRosterPage[] = [];
  let start = from;
  for (let index = 0; index < count; index++) {
    const days = base + (index < longer ? 1 : 0);
    pages.push({ start, days });
    start = addDays(start, days);
  }
  return pages;
}

export function printChoreRoster(
  payload: PrintChoreRosterPayload,
  onError: (error: string) => void,
): void {
  // A4 landscape at 96 dpi with 12mm margins, so the page measures real sizes.
  openPrintIframe('/print/chores', {
    messagePrefix: 'PRINT_CHORES',
    payload,
    widthPx: 1032,
    heightPx: 703,
    onError,
  });
}
