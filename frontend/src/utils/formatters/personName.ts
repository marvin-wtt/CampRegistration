const LOWERCASE_PARTICLES = new Set([
  'af',
  'al',
  'ap',
  'av',
  'ben',
  'bin',
  'bint',
  'da',
  'das',
  'de',
  'del',
  'della',
  'den',
  'der',
  'di',
  'dos',
  'du',
  'el',
  'ibn',
  'la',
  'las',
  'le',
  'los',
  'op',
  'te',
  'ten',
  'ter',
  'van',
  'von',
  'y',
  'zu',
]);

const UPPERCASE_SUFFIXES = new Set([
  'ii',
  'iii',
  'iv',
  'v',
  'vi',
  'vii',
  'viii',
  'ix',
  'x',
]);

const LOWERCASE_SUFFIXES = new Set(['jr', 'sr']);

// Surnames that start with "mac" but are NOT the Gaelic Mac- prefix.
// Extend this as real-world data surfaces more cases.
const MAC_EXCEPTIONS = new Set([
  'mace',
  'machado',
  'macias',
  'maciel',
  'mack',
  'macklin',
  'macon',
  'macy',
]);

// Matches initials like "J.", "J.R.R."
const INITIALS_PATTERN = /^([a-z]\.)+$/i;

export function formatPersonName(name: string | undefined): string {
  if (!name) {
    return '-';
  }

  const parts = name.trim().replace(/\s+/g, ' ').split(' ');
  return parts
    .map((part, index) => formatNamePart(part, index, parts.length))
    .join(' ');
}

function formatNamePart(part: string, index: number, total: number): string {
  const hadPeriod = part.endsWith('.');
  // Note: plain toLowerCase/toUpperCase (not toLocale*) so that matching is
  // not affected by the host locale (e.g. Turkish dotless-ı).
  const normalized = part.toLowerCase().replace(/\.$/, '');
  const isLast = index === total - 1;

  // Suffixes only apply to the last token of a multi-token name, so that
  // given names like "Vi" or "Bin" are never treated as suffixes.
  if (isLast && total > 1) {
    if (UPPERCASE_SUFFIXES.has(normalized)) {
      return normalized.toUpperCase() + (hadPeriod ? '.' : '');
    }
    if (LOWERCASE_SUFFIXES.has(normalized)) {
      return capitalize(normalized) + (hadPeriod ? '.' : '');
    }
  }

  // Initials: "j.r.r." -> "J.R.R."
  if (INITIALS_PATTERN.test(part)) {
    return part.toUpperCase();
  }

  // Keep particles lowercase unless they are the first part of the name.
  // Caveat: this is culturally ambiguous — correct for "Vincent van Gogh",
  // wrong for "Dick Van Dyke". Pick the convention that fits your data.
  if (index > 0 && LOWERCASE_PARTICLES.has(normalized)) {
    return normalized;
  }

  return part.split('-').map(formatHyphenSegment).join('-');
}

function formatHyphenSegment(segment: string): string {
  return segment.split("'").map(formatApostropheSegment).join("'");
}

function formatApostropheSegment(segment: string): string {
  const lower = segment.toLowerCase();

  // "Mc" is almost always the Gaelic prefix: McDonald, McElroy, ...
  if (lower.startsWith('mc') && lower.length > 2) {
    return 'Mc' + capitalize(lower.slice(2));
  }

  // "Mac" frequently is NOT a prefix (Macy, Mack, Machado, ...),
  // so only apply the rule outside the known exceptions.
  if (
    lower.startsWith('mac') &&
    lower.length > 3 &&
    !MAC_EXCEPTIONS.has(lower)
  ) {
    return 'Mac' + capitalize(lower.slice(3));
  }

  return capitalize(lower);
}

function capitalize(value: string): string {
  if (value.length === 0) {
    return value;
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}
