const dbJsonPath = (
  key: string,
  data: Record<string, (string | number)[]>,
): string | undefined => {
  if (!(key in data)) {
    return undefined;
  }

  return "$." + data[key].join(".");
};

export default dbJsonPath;
