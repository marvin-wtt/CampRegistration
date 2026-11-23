import type { SurveyModel } from 'survey-core';
import { setVariables, type Data } from './variables/variables.js';
import { addFileSlotResolver, fileSlotPath } from './fileSlots.js';

export type EventSurveyData = Data & { id: string };

export interface EventSurveyOptions {
  /** The group the form is answered for; fixed for the survey's lifetime. */
  group?: string | null | undefined;
  /** `de_DE` is accepted too; SurveyJS only resolves `de-DE`. */
  locale?: string | undefined;
  /**
   * Where a `{_file.<slot>}` placeholder links. Defaults to the root-relative
   * slot route the browser and the server write alike — what consent texts
   * holding one are compared by.
   */
  resolveFileSlot?: (
    slot: string,
    locale: string,
    group: string | null,
  ) => string;
}

export interface EventSurvey {
  /** Applies newer event data, such as a refetched event. */
  setEvent(event: EventSurveyData): void;
}

/**
 * Prepares a survey of an event's form: its `{event.*}` variables, resolved
 * again whenever the locale changes, and its file links. Every surface of the
 * form — registration, preview, PDF, server — is set up here, so all of them
 * show and compute the same.
 */
export function prepareEventSurvey(
  model: SurveyModel,
  event: EventSurveyData,
  options: EventSurveyOptions = {},
): EventSurvey {
  let current = event;
  const apply = () => {
    setVariables(model, current, { group: options.group });
  };

  if (options.locale) {
    model.locale = options.locale.replace('_', '-');
  }
  apply();
  // Dates, names and prices are written in the locale.
  model.onLocaleChangedEvent.add(apply);

  addFileSlotResolver(
    model,
    options.resolveFileSlot ??
      ((slot, locale, group) =>
        fileSlotPath(current.id, slot, { locale, group })),
  );

  return {
    setEvent(event) {
      current = event;
      apply();
    },
  };
}
