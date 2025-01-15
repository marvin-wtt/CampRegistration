import questions from './questions/index.js';
import functions from './functions/index.js';
import properties from './properties/index.js';
import { setVariables } from './variables/index.js';

(async () => {
  const { Serializer, ComponentCollection, FunctionFactory } = await import(
    'survey-core'
  );

  for (const component of questions) {
    ComponentCollection.Instance.remove(component.name);
    ComponentCollection.Instance.add(component);
  }

  for (const fn of functions) {
    FunctionFactory.Instance.unregister(fn.name);
    FunctionFactory.Instance.register(fn.name, fn.func, fn.isAsync);
  }

  for (const property of properties) {
    Serializer.removeProperty(property.className, property.propertyInfo.name);
    Serializer.addProperty(property.className, property.propertyInfo);
  }

  Serializer.getProperty('file', 'storeDataAsText').visible = false;
  Serializer.getProperty('file', 'storeDataAsText').defaultValue = false;
})();

export { setVariables };
