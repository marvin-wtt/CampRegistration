import { ComponentCollection, FunctionFactory, Serializer } from 'survey-core';
import questions from './questions';
import functions from './functions';
import properties from './properties';

let initiated = false;

export const init = (
  componentCollectionInstance: typeof ComponentCollection.Instance,
  functionFactoryInstance: typeof FunctionFactory.Instance,
  serializer: typeof Serializer,
) => {
  for (const component of questions) {
    componentCollectionInstance.remove(component.name);
    componentCollectionInstance.add(component);
  }

  for (const fn of functions) {
    functionFactoryInstance.unregister(fn.name);
    functionFactoryInstance.register(fn.name, fn.func, fn.isAsync);
  }

  for (const property of properties) {
    serializer.removeProperty(property.className, property.propertyInfo.name);
    serializer.addProperty(property.className, property.propertyInfo);
  }

  serializer.getProperty('file', 'storeDataAsText').visible = false;
  serializer.getProperty('file', 'storeDataAsText').defaultValue = false;

  initiated = true;
}

if (!initiated) {
  init(ComponentCollection.Instance, FunctionFactory.Instance, Serializer);
}

