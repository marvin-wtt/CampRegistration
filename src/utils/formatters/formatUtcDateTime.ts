export function formatUtcDateTime(timestamp: string) {
  const date = new Date(timestamp);

  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

}
