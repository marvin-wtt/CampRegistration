import { escapeHtml } from '#core/mail/templating';
import type { RegistrationChange } from '../registration.changes.js';

// How a change list looks in a mail, and how the rendered mail is tidied up
// around it. Which answers changed is worked out in `registration.changes`.

/** Wording the renderers need, supplied by the caller so this stays i18n-free. */
export interface ChangeLabels {
  cleared: string;
  file: string;
}

const LIST_STYLE = 'margin:0 0 1em 0;padding-left:1.5em;';
const ITEM_STYLE = 'margin-bottom:0.25em;';

function valueMarkup(change: RegistrationChange, labels: ChangeLabels): string {
  if (change.isFile) {
    return `<em>${escapeHtml(labels.file)}</em>`;
  }
  if (change.value === null) {
    return `<em>${escapeHtml(labels.cleared)}</em>`;
  }
  return escapeHtml(change.value);
}

function valueText(change: RegistrationChange, labels: ChangeLabels): string {
  if (change.isFile) {
    return labels.file;
  }
  return change.value ?? labels.cleared;
}

/**
 * The change list as an email-safe fragment. Styles are inline because Gmail is
 * unreliable about head `<style>` blocks, and every value sits in its own
 * `change-value` span so `redactChangeValues` can lift them back out.
 */
export function renderChangesHtml(
  changes: RegistrationChange[],
  labels: ChangeLabels,
): string {
  if (changes.length === 0) {
    return '';
  }

  const items = changes
    .map((change) => {
      const label = escapeHtml(change.label);
      const value = valueMarkup(change, labels);

      return `<li style="${ITEM_STYLE}"><strong>${label}</strong><span class="change-value">: ${value}</span></li>`;
    })
    .join('');

  return `<ul class="registration-changes" style="${LIST_STYLE}">${items}</ul>`;
}

/** The same list as one plain line, for contexts that cannot carry markup. */
export function renderChangesText(
  changes: RegistrationChange[],
  labels: ChangeLabels,
): string {
  return changes
    .map((change) => `${change.label}: ${valueText(change, labels)}`)
    .join(', ');
}

const CHANGE_VALUE_RE = /<span class="change-value">[\s\S]*?<\/span>/g;
const WRAPPED_BLOCK_RE =
  /<p>\s*(<ul class="registration-changes"[\s\S]*?<\/ul>)\s*<\/p>/g;

/**
 * Strips the answers out of a rendered change list, leaving the field labels.
 *
 * The mail itself goes to the address the registrant gave for this
 * correspondence, but `MessageDelivery.body` is a durable copy readable by
 * every manager of the event — that copy names what moved without repeating what
 * it now says.
 */
export function redactChangeValues(html: string): string {
  return html.replace(CHANGE_VALUE_RE, '');
}

/**
 * Lifts the list out of the paragraph the editor wraps around a standalone
 * token. `<ul>` inside `<p>` is not valid, and parsers recover from it by
 * splitting the paragraph.
 */
export function unwrapChangesBlock(html: string): string {
  return html.replace(WRAPPED_BLOCK_RE, '$1');
}
