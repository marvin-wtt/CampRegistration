export const generateQueryString = (params: Record<string, string>): string => {
  return Object.keys(params)
    .map((key) => {
      const value = encodeURIComponent(params[key]);
      return `${key}=${value}`;
    })
    .join("&");
};
