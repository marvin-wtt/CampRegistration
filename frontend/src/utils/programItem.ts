import type { ProgramItem } from '@camp-registration/common/entities';
import { parseTimeToMinutes } from '@/utils/date';

/**
 * Fallback swatch for a program item with no `color` chosen — user-assigned
 * content data, not a themed UI role, so it stays a literal rather than an
 * MD3 token. Matches the default used by the manager-side calendar
 * (`CalendarItem.vue`, `CalendarDayItem.vue`), so an uncoloured item looks
 * the same to a manager and to a public viewer.
 */
export const DEFAULT_PROGRAM_ITEM_COLOR = '#2196F3';

/**
 * A program item's time range in minutes since midnight, or `null` when it
 * has no (valid) `time` — untimed items can't meaningfully overlap anything.
 * Missing `duration` defaults to 60 minutes, the shared assumption behind
 * every overlap computation across the program planner and its public view.
 */
export function programItemMinutesRange(
  item: Pick<ProgramItem, 'time' | 'duration'>,
): { start: number; end: number } | null {
  if (!item.time) {
    return null;
  }

  const start = parseTimeToMinutes(item.time);
  if (start === null) {
    return null;
  }

  return { start, end: start + (item.duration ?? 60) };
}

/** A duration in minutes as e.g. "1 hr 30 min", in the given locale. */
export function formatProgramItemDuration(
  minutes: number,
  locale: string,
): string {
  const unit = (value: number, unit: 'hour' | 'minute') =>
    new Intl.NumberFormat(locale, {
      style: 'unit',
      unit,
      unitDisplay: 'short',
    }).format(value);

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) {
    return unit(rest, 'minute');
  }
  return rest === 0
    ? unit(hours, 'hour')
    : `${unit(hours, 'hour')} ${unit(rest, 'minute')}`;
}
