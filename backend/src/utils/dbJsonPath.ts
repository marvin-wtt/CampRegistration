const dbJsonPath = (
  key: string,
  data: Record<string, (string | number)[][]>,
  index = 0,
): string | undefined => {
  if (!(key in data)) {
    return undefined;
  }

  return "$." + data[key][index].join(".");
};

export default dbJsonPath;
