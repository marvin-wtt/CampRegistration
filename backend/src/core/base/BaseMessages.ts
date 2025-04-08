import config from '#config/index.js';
import { generateQueryString } from '#utils/uri.js';

export abstract class BaseMessages {
  generateUrl(path: string, params: Record<string, string> = {}) {
    const { origin } = config;
    const query = generateQueryString(params);

    return `${origin}/${path}?${query}`;
  }
}
