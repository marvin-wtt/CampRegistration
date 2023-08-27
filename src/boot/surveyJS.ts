import { boot } from 'quasar/wrappers';
import { surveyPlugin } from 'survey-vue3-ui';
import 'survey-core/survey.i18n';
import { ComponentCollection, FunctionFactory } from 'survey-core';
import { address, country, dateOfBirth } from 'src/lib/surveyJs/questions';
import { htmlDate, isMinor, subtractYears } from 'src/lib/surveyJs/functions';

export default boot(({ app }) => {
  app.use(surveyPlugin);
});

// Custom question types
ComponentCollection.Instance.add(address);
ComponentCollection.Instance.add(country);
ComponentCollection.Instance.add(dateOfBirth);

// Custom functions
FunctionFactory.Instance.register('isMinor', isMinor);
FunctionFactory.Instance.register('subtractYearsFromDate', subtractYears);
FunctionFactory.Instance.register('htmlDate', htmlDate);
