import { monotonicFactory } from 'ulidx';

const generator = monotonicFactory();
export const ulid = () => {
  return generator();
};
