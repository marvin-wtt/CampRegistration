const dbJsonPath = (...keys: string[]): string | undefined => {
  return "$." + keys.join(".");
};

export default dbJsonPath;
