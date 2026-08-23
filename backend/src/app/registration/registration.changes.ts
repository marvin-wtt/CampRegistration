import Handlebars from 'handlebars';
import type { Camp, Registration } from '#generated/prisma/client.js';
import { formUtils, type FormAnswer } from '#utils/form';
import logger from '#core/logger';

/** One form field whose answer differs between two versions of a registration. */
export interface RegistrationChange {
  /** Dotted question path, e.g. `attendees.0.diet`. */
  path: string;
  /** Localized breadcrumb title, e.g. `Food > Diet`. */
  label: string;
  /** Formatted new display value; `null` when the field was cleared. */
  value: string | null;
  /** File answers are ULIDs — the caller words these instead of printing them. */
  isFile: boolean;
}

/** Wording the renderers need, supplied by the caller so this stays i18n-free. */
export interface ChangeLabels {
  cleared: string;
  file: string;
}

/**
 * Long free text is summarised rather than reproduced. A diet or a phone number
 * survives intact; a paragraph of medical history does not travel whole.
 */
const MAX_VALUE_LENGTH = 200;

function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null || value === '') {
    return true;
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }
  return false;
}

function truncate(value: string): string {
  return value.length > MAX_VALUE_LENGTH
    ? `${value.slice(0, MAX_VALUE_LENGTH).trimEnd()}…`
    : value;
}

function formatValue(value: unknown): string | null {
  if (isEmpty(value)) {
    return null;
  }

  if (Array.isArray(value)) {
    const parts = value
      .map((entry) => formatValue(entry))
      .filter((entry): entry is string => entry !== null);

    return parts.length > 0 ? truncate(parts.join(', ')) : null;
  }

  if (typeof value === 'object') {
    // Nested display values (a file entry, a composite answer) have no reliable
    // textual form — the label alone still tells the reader what moved.
    return null;
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return truncate(String(value));
  }

  return null;
}

function answersFor(
  camp: Camp,
  data: unknown,
  locale: string,
): Map<string, FormAnswer> {
  // `freePlaces` only feeds `visibleIf` expressions, which do not affect how an
  // answer is labelled or displayed — a mail payload carries no place count.
  const form = formUtils({ ...camp, freePlaces: 0 }, data, { locale });

  return new Map(form.answers().map((answer) => [answer.path, answer]));
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (isEmpty(a) && isEmpty(b)) {
    return true;
  }

  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

/**
 * The form fields whose answers differ between two versions of a registration,
 * labelled and formatted in `locale`.
 *
 * Both sides are read through the camp's form rather than walked as raw JSON:
 * the form resolves each field's title and its answer's display text in the
 * given locale, which is what makes the result readable to its recipient.
 */
export function diffRegistrationData(
  camp: Camp,
  before: unknown,
  after: unknown,
  locale: string,
): RegistrationChange[] {
  const previous = answersFor(camp, before, locale);
  const current = answersFor(camp, after, locale);

  const changes: RegistrationChange[] = [];

  const record = (answer: FormAnswer, value: string | null) => {
    changes.push({
      path: answer.path,
      label: answer.label,
      value,
      isFile: answer.isFile,
    });
  };

  // Form order first, so the list reads like the form the recipient filled in.
  for (const [path, answer] of current) {
    const other = previous.get(path);
    if (other && deepEqual(other.value, answer.value)) {
      continue;
    }
    if (!other && isEmpty(answer.value)) {
      continue;
    }

    record(
      answer,
      // A file answer is a stored id, never something to show a reader. The
      // renderers word these from `isFile` instead.
      answer.isFile ? null : formatValue(answer.displayValue ?? answer.value),
    );
  }

  // Rows and panels that existed before and are gone now have no entry above.
  for (const [path, answer] of previous) {
    if (current.has(path) || isEmpty(answer.value)) {
      continue;
    }

    record(answer, null);
  }

  return changes;
}

/**
 * What changed about a registration, in the language it would be mailed in.
 *
 * Computed where both versions are still in hand rather than at send time: the
 * mail payload travels through the job queue, where it is retained for weeks,
 * and the previous answers include any the participant has just deleted. The
 * change list is the only part of them the mail actually needs.
 *
 * Never throws. A form that cannot be read is a reason to send the mail without
 * a change list, never a reason to fail the edit that triggered it.
 */
export function changesForRegistration(
  camp: Camp,
  previous: Registration,
  current: Registration,
): RegistrationChange[] {
  // Country picks the group's language where a camp has several; `locale` is
  // the fallback, and only its language part is a form locale.
  const locale = (current.country ?? current.locale).split('-')[0];

  try {
    return diffRegistrationData(camp, previous.data, current.data, locale);
  } catch (err) {
    logger.warn(
      `Failed to build the change list for registration ${current.id}: ${err instanceof Error ? err.message : String(err)}`,
    );
    return [];
  }
}

const LIST_STYLE = 'margin:0 0 1em 0;padding-left:1.5em;';
const ITEM_STYLE = 'margin-bottom:0.25em;';

function valueMarkup(change: RegistrationChange, labels: ChangeLabels): string {
  if (change.isFile) {
    return `<em>${Handlebars.escapeExpression(labels.file)}</em>`;
  }
  if (change.value === null) {
    return `<em>${Handlebars.escapeExpression(labels.cleared)}</em>`;
  }
  return Handlebars.escapeExpression(change.value);
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
      const label = Handlebars.escapeExpression(change.label);
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
 * every manager of the camp — that copy names what moved without repeating what
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
