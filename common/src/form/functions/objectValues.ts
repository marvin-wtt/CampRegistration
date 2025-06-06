const objectValues = (params: unknown[]): unknown[] | null => {
  if (params.length === 0) {
    return null;
  }

  const obj = params[0];
  if (!obj || typeof obj !== 'object') {
    return null;
  }

  return Object.values<unknown>(obj as Record<string, unknown>);
};

export default objectValues;
