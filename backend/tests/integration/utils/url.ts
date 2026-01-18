export const generateQueryString = (params: Record<string, string>): string => {
  return Object.entries(params)
    .map(([key, value]) => {
      const encodedKey = encodeURIComponent(key);
      const encodedValue = encodeURIComponent(value);
      return `${encodedKey}=${encodedValue}`;
    })
    .join('&');
};
