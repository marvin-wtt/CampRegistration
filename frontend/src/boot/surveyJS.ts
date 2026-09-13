import { defineBoot } from '#q-app';
import '@camp-registration/common/form';
import 'survey-core/i18n/german';
import 'survey-core/i18n/french';
import { slk } from 'survey-core';
// Bridges MD3 onto the SurveyJS design tokens. SurveyJS stamps
// `sjs-theme-overrides` on every survey root and on the Survey Creator root, so
// importing the stylesheet is all it takes to re-skin both.
import '@/lib/surveyJs/theme/md3-adapter.scss';

export default defineBoot(() => {
  const licenseKey = import.meta.env.SURVEYJS_LICENSE_KEY;

  if (!licenseKey && import.meta.env.QUASAR_PROD) {
    // eslint-disable-next-line no-console
    console.warn('SURVEYJS_LICENSE_KEY is not configured.');
    return;
  }

  if (licenseKey) {
    slk(licenseKey);
  }
});
