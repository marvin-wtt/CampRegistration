import htmlDate from './htmlDate.js';
import subtractYears from './subtractYears.js';

const isMinor = (params: unknown[]) => {
  if (params.length < 1 || params[0] === null) {
    return null;
  }

  if (typeof params[0] !== 'string') {
    return null;
  }
  if (typeof params[1] !== 'string' && !(params[1] instanceof Date)) {
    return null;
  }

  const birthdate = htmlDate([params[0]]);
  const adultsBornBy = subtractYears([params[1], 18]);
  if (!birthdate || !adultsBornBy) {
    return null;
  }

  // ISO dates compare as strings: adult from the 18th birthday on.
  return birthdate > adultsBornBy;
};

export default isMinor;
