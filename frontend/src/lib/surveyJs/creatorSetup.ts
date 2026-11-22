// Global Survey Creator registrations. SurveyJS keeps these in singletons, so
// they run once on import rather than on every editor mount.
import 'survey-creator-core/i18n/german';
import 'survey-creator-core/i18n/french';
import 'survey-creator-core/i18n/polish';
import 'survey-creator-core/i18n/czech';
import { config as aceConfig } from 'ace-builds';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/ext-searchbox';
import 'ace-builds/src-noconflict/theme-clouds_midnight';
import aceJsonWorkerUrl from 'ace-builds/src-noconflict/worker-json?url';
import {
  AceJsonEditorModel,
  localization,
  PropertyGridEditorCollection,
} from 'survey-creator-core';
import { SvgRegistry } from 'survey-core';
import { REGISTRATION_PROPERTY_CATEGORY } from '@camp-registration/common/form';
import eventDataMapping from '@/lib/surveyJs/properties/eventDataMapping';
import { hideIrrelevantProperties } from '@/lib/surveyJs/hiddenProperties';
import { surveyCreatorCustomLocaleConfig } from '@/components/event/settings/form/form-editor-translations';

// Ace is bundled; the creator only sets the JSON mode when a base path is
// given, so point it at the bundled worker's directory — nothing hits a CDN.
aceConfig.setModuleUrl('ace/mode/json_worker', aceJsonWorkerUrl);
AceJsonEditorModel.aceBasePath = new URL(
  './',
  new URL(aceJsonWorkerUrl, location.href),
).href;

PropertyGridEditorCollection.register(eventDataMapping);

hideIrrelevantProperties();

// Keys that would reach an object's prototype instead of the object.
const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

// Deep, so a nested section like `pe.tabs` adds to the built-in strings
// instead of replacing them.
function mergeStrings(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): void {
  for (const [key, value] of Object.entries(source)) {
    if (UNSAFE_KEYS.has(key)) {
      continue;
    }
    const existing = Object.hasOwn(target, key) ? target[key] : undefined;
    if (
      value &&
      typeof value === 'object' &&
      existing &&
      typeof existing === 'object'
    ) {
      mergeStrings(
        existing as Record<string, unknown>,
        value as Record<string, unknown>,
      );
    } else {
      target[key] = value;
    }
  }
}

for (const [locale, sections] of Object.entries(
  surveyCreatorCustomLocaleConfig,
)) {
  mergeStrings(localization.getLocale(locale), sections);
}

// The property grid shows each category as an icon named after it; ours
// ("Anmeldung") would otherwise get a placeholder. A clipboard, like a form.
SvgRegistry.registerIcon(
  `pg-${REGISTRATION_PROPERTY_CATEGORY}-24x24`,
  '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>',
);
