import { ICustomQuestionTypeConfiguration } from 'survey-core';
import { address, country, dateOfBirth, role } from './questions';
import { htmlDate, isAdult, isMinor, subtractYears } from './functions';
import { campDataType } from './property';

export const Components: ICustomQuestionTypeConfiguration[] = [
  address,
  country,
  dateOfBirth,
  role,
];

type RegisterFunctionParams = {
  name: string;
  func: (params: unknown[]) => unknown;
  isAsync?: boolean;
};

export const Functions: RegisterFunctionParams[] = [
  {
    name: 'isMinor',
    func: isMinor,
  },
  {
    name: 'isAdult',
    func: isAdult,
  },
  {
    name: 'subtractYears',
    func: subtractYears,
  },
  {
    name: 'htmlDate',
    func: htmlDate,
  },
];

type AddPropertyParams = {
  classname: string;
  propertyInfo: unknown;
};

export const Properties: AddPropertyParams[] = [
  {
    classname: 'question',
    propertyInfo: campDataType,
  },
];
