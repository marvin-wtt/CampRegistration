import config from '#config/index';

export function generateUrl(
  path: string | string[],
  params: Record<string, string> = {},
) {
  const { origin } = config;
  const query = new URLSearchParams(params).toString();
  path = Array.isArray(path) ? path.join('/') : path;

  return `${origin}/${path}${query ? `?${query}` : ''}`;
}

export function generateApiUrl(path: string | string[]): string {
  const { origin } = config;
  path = Array.isArray(path) ? path.join('/') : path;

  return `${origin}/api/v1/${path}`;
}
