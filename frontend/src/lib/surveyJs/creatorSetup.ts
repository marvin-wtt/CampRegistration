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

for (const [locale, sections] of Object.entries(
  surveyCreatorCustomLocaleConfig,
)) {
  const strings = localization.getLocale(locale);

  for (const [key, source] of Object.entries(sections)) {
    const target = strings[key];
    if (target && typeof target === 'object') {
      Object.assign(target, source);
    }
  }
}
