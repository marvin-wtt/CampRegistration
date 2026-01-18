import config from '#config/index';
import { generateQueryString } from '#utils/uri';

export function generateUrl(
  path: string | string[],
  params: Record<string, string> = {},
) {
  const { origin } = config;
  const query = generateQueryString(params);
  path = Array.isArray(path) ? path.join('/') : path;

  return `${origin}/${path}?${query}`;
}
