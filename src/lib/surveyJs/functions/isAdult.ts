import { isMinor } from './';

const isAdult = (params: unknown[]) => {
  return !isMinor(params);
};

export default isAdult;
