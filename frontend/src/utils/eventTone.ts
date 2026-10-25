export const EVENT_TONES = ['primary', 'secondary', 'tertiary'] as const;

export type EventTone = (typeof EVENT_TONES)[number];

/**
 * A stable accent color role per event, so an event without a banner or logo
 * still looks the same wherever it appears.
 */
export function eventTone(eventId: string): EventTone {
  const hash = [...eventId].reduce((acc, char) => acc + char.charCodeAt(0), 0);

  return EVENT_TONES[hash % EVENT_TONES.length] ?? 'primary';
}
