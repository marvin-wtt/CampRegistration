import { boot } from 'quasar/wrappers';
import { surveyPlugin } from 'survey-vue3-ui';
import 'survey-core/survey.i18n';
import 'survey-core/modern.min.css';

export default boot(({ app }) => {
  app.use(surveyPlugin);
});
