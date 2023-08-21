import { boot } from 'quasar/wrappers';
import { surveyPlugin } from 'survey-vue3-ui';
import 'survey-core/survey.i18n';

export default boot(({ app }) => {
  app.use(surveyPlugin);
});
