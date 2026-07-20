import { defineBoot } from '#q-app';
import '@camp-registration/common/form';
import 'survey-core/i18n/german';
import 'survey-core/i18n/french';
import { slk } from 'survey-core';

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
