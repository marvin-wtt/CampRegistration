import { boot } from 'quasar/wrappers';
import { surveyPlugin } from 'survey-vue3-ui';
import { surveyCreatorPlugin } from 'survey-creator-vue';
import '@camp-registration/common/form';
import 'survey-core/i18n/german';
import 'survey-core/i18n/french';

export default boot(({ app }) => {
  app.use(surveyPlugin);
  app.use(surveyCreatorPlugin);
});
