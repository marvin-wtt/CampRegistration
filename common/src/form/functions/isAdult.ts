import isMinor from './isMinor.js';

const isAdult = (params: unknown[]) => {
  const minor = isMinor(params);

  if (typeof minor !== 'boolean') {
    return null;
  }

  return !minor;
};

export default isAdult;
