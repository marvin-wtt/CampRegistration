import { boot } from 'quasar/wrappers';
import { surveyPlugin } from 'survey-vue3-ui';
import { surveyCreatorPlugin } from 'survey-creator-vue';
import '@camp-registration/common/form';
import 'survey-core/i18n/german';
import 'survey-core/i18n/french';
import { setLicenseKey } from 'survey-core';
import * as process from 'process';

export default boot(({ app }) => {
  setLicense();

  app.use(surveyPlugin);
  app.use(surveyCreatorPlugin);
});

function setLicense() {
  const licenseKey = process.env.SURVEYJS_LICENCE_KEY;
  if (licenseKey) {
    setLicenseKey(licenseKey);
  }
}
