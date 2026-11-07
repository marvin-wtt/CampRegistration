export function anonymizeIp(ip: string): string {
  // IPv4: zero out the last octet
  const ipv4Match = /^(\d{1,3}\.\d{1,3}\.\d{1,3})\.\d{1,3}$/.exec(ip);
  if (ipv4Match) {
    return `${ipv4Match[1]}.0`;
  }

  // IPv6: keep first /48 (first 3 groups of the fully-expanded address)
  if (ip.includes(':')) {
    const expanded = expandIPv6(ip);
    if (!expanded) {
      return '';
    }
    const groups = expanded.split(':');
    return `${groups.slice(0, 3).join(':')}::`;
  }

  return '';
}

function expandIPv6(ip: string): string {
  const halves = ip.split('::');

  if (halves.length > 2) {
    return ''; // invalid: more than one ::
  }

  if (halves.length === 2) {
    const left = halves[0] ? halves[0].split(':') : [];
    const right = halves[1] ? halves[1].split(':') : [];
    const missing = 8 - left.length - right.length;
    if (missing < 0) {
      return ''; // invalid
    }
    return [...left, ...Array<string>(missing).fill('0'), ...right].join(':');
  }

  // No ::, address should already be in full 8-group form
  return ip;
}
