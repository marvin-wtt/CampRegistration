import type {
  Chore,
  ChoreAssignment,
  Translatable,
} from '@camp-registration/common/entities';
import { openPrintIframe } from '@/utils/printIframe';

export interface PrintChoreRosterPayload {
  eventName: Translatable;
  // Mondays of the weeks to print, one page each.
  weekStarts: string[];
  chores: Chore[];
  assignments: ChoreAssignment[];
  // Registration id → display name, resolved by the opener.
  names: [string, string][];
}

export function printChoreRoster(
  payload: PrintChoreRosterPayload,
  onError: (error: string) => void,
): void {
  const key = `print:chores:${Date.now()}`;
  sessionStorage.setItem(key, JSON.stringify(payload));

  // A4 landscape at 96 dpi with 12mm margins, so the page measures real sizes.
  openPrintIframe(`/print/chores?key=${encodeURIComponent(key)}`, {
    messagePrefix: 'PRINT_CHORES',
    widthPx: 1032,
    heightPx: 703,
    onError,
  });
}
