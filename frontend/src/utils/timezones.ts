export interface TimezoneOption {
  label: string;
  value: string;
}

function offsetLabel(timeZone: string, date: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'shortOffset',
  }).formatToParts(date);

  const offset = parts.find((part) => part.type === 'timeZoneName')?.value;

  return offset?.replace('GMT', 'UTC') ?? 'UTC';
}

/** Every IANA timezone, labelled with its current UTC offset. */
export function timezoneOptions(): TimezoneOption[] {
  const now = new Date();

  return Intl.supportedValuesOf('timeZone')
    .map((zone) => ({
      value: zone,
      label: `${zone.replace(/_/g, ' ')} (${offsetLabel(zone, now)})`,
    }))
    .sort((a, b) => a.value.localeCompare(b.value));
}

/** The viewer's own IANA timezone, e.g. as a default for a new event. */
export function browserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
