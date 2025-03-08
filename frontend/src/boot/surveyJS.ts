import { defineBoot } from '#q-app/wrappers';
import '@camp-registration/common/form';
import 'survey-core/i18n/german';
import 'survey-core/i18n/french';
import { slk } from 'survey-core';

export default defineBoot(() => {
  slk(process.env.SURVEYJS_LICENCE_KEY ?? '');
});
