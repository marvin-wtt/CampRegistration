export function anonymizeIp(ip: string): string {
  // IPv4: zero out the last octet
  const ipv4Match = /^(\d{1,3}\.\d{1,3}\.\d{1,3})\.\d{1,3}$/.exec(ip);
  if (ipv4Match) {
    return `${ipv4Match[1]}.0`;
  }

  // IPv6: keep first 3 non-empty groups (removes last ~80 bits)
  if (ip.includes(':')) {
    const groups = ip.split(':').filter((g) => g !== '');
    const prefix = groups.slice(0, 3);
    return prefix.length > 0 ? `${prefix.join(':')}::` : '::';
  }

  return '';
}
