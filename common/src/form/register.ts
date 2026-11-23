import { ComponentCollection, FunctionFactory, Serializer } from 'survey-core';
import questions from './questions/index.js';
import functions from './functions/index.js';
import properties from './properties/index.js';

/**
 * Registers the platform's question types, expression functions and
 * properties with SurveyJS's global registries. Importing
 * `@camp-registration/common/form` runs it, so no code that reads a form can
 * miss it — a form without them loses its `country`, `address` and `role`
 * questions. Safe to run again: each entry replaces its earlier copy.
 */
export function registerFormExtensions(): void {
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

  // Uploads are stored as files, never inlined into the response.
  const storeDataAsText = Serializer.getProperty('file', 'storeDataAsText');
  storeDataAsText.visible = false;
  storeDataAsText.defaultValue = false;
}
