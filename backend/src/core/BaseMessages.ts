import config from '#config/index';
import { generateQueryString } from '#utils/uri';

export abstract class BaseMessages {
  generateUrl(path: string, params: Record<string, string> = {}) {
    const { origin } = config;
    const query = generateQueryString(params);

    return `${origin}/${path}?${query}`;
  }
}
