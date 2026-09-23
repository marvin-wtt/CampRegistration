import { htmlToText } from 'html-to-text';

const DEFAULT_MAX_LENGTH = 150;

/**
 * Derives an inbox preview snippet from an email's HTML body — the hidden
 * `mj-preview` text most clients show next to the subject line.
 */
export function htmlToPreviewText(
  html: string,
  maxLength = DEFAULT_MAX_LENGTH,
): string {
  const text = htmlToText(html).replace(/\s+/g, ' ').trim();

  if (text.length <= maxLength) {
    return text;
  }

  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  return `${(lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated).trimEnd()}…`;
}
