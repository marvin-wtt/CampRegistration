import type { SurveyModel } from 'survey-core';
import { FILE_VARIABLE } from './files.js';

const FILE_PREFIX = `${FILE_VARIABLE}.`;

export interface FileSlotOptions {
  /** Without one, the server picks by the browser's Accept-Language. */
  locale?: string | undefined;
  /** Without one, the server uses the event's only group, if it has one. */
  group?: string | null | undefined;
}

/**
 * Where a `{_file.<slot>}` placeholder links: the route that serves the slot's
 * file once opened, so nothing is fetched to write it. Root-relative, so the
 * browser and the server write the same link — consent texts holding one are
 * compared exactly (docs/privacy.md, 5).
 */
export function fileSlotPath(
  eventId: string,
  slot: string,
  options: FileSlotOptions = {},
): string {
  const params = new URLSearchParams();
  if (options.locale) {
    params.set('locale', options.locale);
  }
  if (options.group) {
    params.set('group', options.group);
  }
  const query = params.toString();

  return `/api/v1/events/${eventId}/files/slots/${slot}/${query ? `?${query}` : ''}`;
}

/**
 * Resolves `{_file.<slot>}` placeholders through `resolveUrl`, for the form's
 * locale and group (`{event.group}`, fixed for the form's lifetime).
 */
export function addFileSlotResolver(
  model: SurveyModel,
  resolveUrl: (slot: string, locale: string, group: string | null) => string,
): void {
  model.onProcessDynamicText.add((sender, options) => {
    if (options.isExists || !options.name.startsWith(FILE_PREFIX)) {
      return;
    }
    const group: unknown = sender.getVariable('event.group');
    options.value = resolveUrl(
      options.name.slice(FILE_PREFIX.length),
      sender.locale,
      typeof group === 'string' ? group : null,
    );
  });
}

/** The resolver for an event's own forms, alike in the browser and on the server. */
export function addEventFileSlotResolver(
  model: SurveyModel,
  eventId: string,
): void {
  addFileSlotResolver(model, (slot, locale, group) =>
    fileSlotPath(eventId, slot, { locale, group }),
  );
}
