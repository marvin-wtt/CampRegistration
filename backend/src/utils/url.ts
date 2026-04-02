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

export function generateApiUrl(path: string | string[]): string {
  const { origin } = config;
  path = Array.isArray(path) ? path.join('/') : path;

  return `${origin}/api/v1/${path}`;
}
