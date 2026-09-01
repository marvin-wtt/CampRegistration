export function toRelativeUrl(url: string): string {
  try {
    const parsed = new URL(url, 'https://placeholder.invalid');
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_ignored) {
    return url;
  }
}
