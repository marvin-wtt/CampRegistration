import isMinor from './isMinor.js';
import isAdult from './isAdult.js';
import subtractYears from './subtractYears.js';
import htmlDate from './htmlDate.js';
import translate from './translate.js';
import objectValues from './objectValues.js';
import joinStrings from './joinStrings.js';
import isWaitingList from './isWaitingList.js';

interface FunctionRegistrationParams {
  name: string;
  func: (params: unknown[]) => unknown;
  isAsync?: boolean;
}

const functions: FunctionRegistrationParams[] = [
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
  {
    name: 'translate',
    func: translate,
  },
  {
    name: 't',
    func: translate,
  },
  {
    name: 'objectValues',
    func: objectValues,
  },
  {
    name: 'joinStrings',
    func: joinStrings,
  },
  {
    name: 'isWaitingList',
    func: isWaitingList,
  },
];

export {
  isMinor,
  isAdult,
  subtractYears,
  htmlDate,
  translate,
  isWaitingList,
  functions,
};

export default functions;
