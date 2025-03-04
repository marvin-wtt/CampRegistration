import questions from './questions/index.js';
import functions from './functions/index.js';
import properties from './properties/index.js';
import { setVariables } from './variables/index.js';
import pkg from 'survey-core';
const { Serializer, ComponentCollection, FunctionFactory } = pkg;

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

export { setVariables };
