/** Mixes a `#rrggbb` color with white; `amount` is the share of white (0–1). */
export function tint(hex: string, amount: number): string {
  const channels = [1, 3, 5].map((start) =>
    parseInt(hex.slice(start, start + 2), 16),
  );

  return (
    '#' +
    channels
      .map((channel) => Math.round(channel + (255 - channel) * amount))
      .map((channel) => channel.toString(16).padStart(2, '0'))
      .join('')
  );
}
