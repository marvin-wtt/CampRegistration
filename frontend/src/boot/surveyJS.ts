import { boot } from 'quasar/wrappers';
import { surveyPlugin } from 'survey-vue3-ui';
import 'survey-core/survey.i18n';
import '@camp-registration/common/form';

export default boot(({ app }) => {
  app.use(surveyPlugin);
});
