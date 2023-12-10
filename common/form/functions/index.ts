import isMinor from './isMinor';
import isAdult from './isAdult';
import subtractYears from './subtractYears';
import htmlDate from './htmlDate';
import translate from './translate';

type FunctionRegistrationParams = {
  name: string;
  func: (params: unknown[]) => unknown;
  isAsync?: boolean;
}

const functions: FunctionRegistrationParams[] = [
  {
    name: 'isMinor',
    func: isMinor
  },
  {
    name: 'isAdult',
    func: isAdult
  },
  {
    name: 'subtractYears',
    func: subtractYears
  },
  {
    name: 'htmlDate',
    func: htmlDate
  },
  {
    name: 'translate',
    func: translate
  },
  {
    name: 't',
    func: translate
  },
];

export {
  isMinor,
  isAdult,
  subtractYears,
  htmlDate,
  translate,
  functions
}

export default functions;
