import { boot } from 'quasar/wrappers';
import { surveyPlugin } from 'survey-vue3-ui';
import 'survey-core/survey.i18n';
import { ComponentCollection, FunctionFactory, Serializer } from 'survey-core';
import { address, country, dateOfBirth, role } from 'src/lib/surveyJs/questions';
import { htmlDate, isAdult, isMinor, subtractYears } from 'src/lib/surveyJs/functions';

export default boot(({ app }) => {
  app.use(surveyPlugin);
});

// Custom question types
ComponentCollection.Instance.add(address);
ComponentCollection.Instance.add(country);
ComponentCollection.Instance.add(dateOfBirth);
ComponentCollection.Instance.add(role);

// Custom functions
FunctionFactory.Instance.register('isMinor', isMinor);
FunctionFactory.Instance.register('isAdult', isAdult);
FunctionFactory.Instance.register('subtractYearsFromDate', subtractYears);
FunctionFactory.Instance.register('htmlDate', htmlDate);

// Files should always be uploaded as a file instead of a base64 encoded string.
Serializer.getProperty('file', 'storeDataAsText').visible = false;
Serializer.getProperty('file', 'storeDataAsText').defaultValue = false;

// Custom widgets
// CustomWidgetCollection.Instance.add()

// Properties
Serializer.addProperty('question', {
  name: 'campData',
  type: 'campDataMapping',
  default: undefined,
  isRequired: false,
  category: 'general',
  visibleIndex: 3,
});
Serializer.addProperty('text', {
  name: 'contact_email',
  displayName: 'Contact email',
  type: 'boolean',
  default: false,
  isRequired: true,
  category: 'camp',
  categoryIndex: 1,
  visibleIndex: 0,
  dependsOn: ['inputType'],
  visibleIf: (obj: { inputType: string }) => {
    return obj.inputType === 'email';
  },
});
