export const MAX_FIELD_LENGTH = 40;
export const FIELD_NAME_PATTERN = /^[a-z0-9_-]+$/;

const FALLBACK_FIELD_NAME = 'file';
// Room kept free for the `-N` version suffix `nextAvailableField` appends.
const VERSION_SUFFIX_RESERVE = 4;

export function slugifyFieldName(value: string): string {
  const slug = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9_]+/g, '-')
    .replace(/^[-_]+|[-_]+$/g, '')
    .replace(/-{2,}/g, '-');

  return slug || FALLBACK_FIELD_NAME;
}

export function trimFieldName(value: string, max = MAX_FIELD_LENGTH): string {
  return value
    .slice(0, max)
    .replace(/[-_]+$/g, '')
    .replace(/^[-_]+/g, '');
}

/**
 * Joins arbitrary parts (e.g. element type, user-chosen element name,
 * property) into a valid base field that still fits a version suffix. A
 * shortened field gets a hash of the full one so two long names don't collide.
 */
export function fieldFromParts(parts: (string | undefined)[]): string {
  const full = parts
    .filter((part): part is string => !!part)
    .map(slugifyFieldName)
    .join('_');
  const max = MAX_FIELD_LENGTH - VERSION_SUFFIX_RESERVE;

  if (full.length <= max) {
    return full;
  }

  const hash = shortHash(full);
  return `${trimFieldName(full, max - hash.length - 1)}_${hash}`;
}

function shortHash(value: string): string {
  let hash = 5381;
  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) + hash + value.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36).slice(0, 6);
}
