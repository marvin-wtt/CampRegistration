import { ComponentCollection, FunctionFactory, Serializer } from 'survey-core';
import { address, country, dateOfBirth, role } from './questions';
import {
  htmlDate,
  isAdult,
  isMinor,
  subtractYears,
  translate,
} from './functions';
import { campDataType } from './property';

ComponentCollection.Instance.add(address);
ComponentCollection.Instance.add(country);
ComponentCollection.Instance.add(dateOfBirth);
ComponentCollection.Instance.add(role);

FunctionFactory.Instance.register('translate', translate, false);
FunctionFactory.Instance.register('t', translate, false);
FunctionFactory.Instance.register('isMinor', isMinor, false);
FunctionFactory.Instance.register('isAdult', isAdult, false);
FunctionFactory.Instance.register('subtractYears', subtractYears, false);
FunctionFactory.Instance.register('htmlDate', htmlDate, false);

Serializer.addProperty('question', campDataType);

Serializer.getProperty('file', 'storeDataAsText').visible = false;
Serializer.getProperty('file', 'storeDataAsText').defaultValue = false;
