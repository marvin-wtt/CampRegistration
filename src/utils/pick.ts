const pick = <T extends object, K extends keyof T>(
  obj: T,
  keys: K[],
): Partial<T> => {
  return keys.reduce<Partial<T>>((finalObj, key) => {
    if (obj && Object.hasOwnProperty.call(obj, key)) {
      finalObj[key] = obj[key];
    }
    return finalObj;
  }, {});
};

export default pick;
