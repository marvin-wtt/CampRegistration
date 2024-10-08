const dbJsonPath = (...keys: string[]): string => {
  keys.unshift('$');

  return keys.join('.');
};

export default dbJsonPath;
