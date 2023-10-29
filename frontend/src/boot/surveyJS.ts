import { boot } from 'quasar/wrappers';
import { surveyPlugin } from 'survey-vue3-ui';
import 'survey-core/survey.i18n';
import { ComponentCollection, FunctionFactory, Serializer } from 'survey-core';
import {
  Components,
  Functions,
  Properties,
} from '@camp-registration/common/form';

export default boot(({ app }) => {
  app.use(surveyPlugin);
});

for (const component of Components) {
  ComponentCollection.Instance.add(component);
}

for (const fn of Functions) {
  FunctionFactory.Instance.register(fn.name, fn.func, fn.isAsync);
}

for (const property of Properties) {
  Serializer.addProperty(property.classname, property.propertyInfo);
}

Serializer.getProperty('file', 'storeDataAsText').visible = false;
Serializer.getProperty('file', 'storeDataAsText').defaultValue = false;
