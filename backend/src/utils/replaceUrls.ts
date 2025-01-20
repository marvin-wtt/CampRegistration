export type UrlReplacer = (url: string) => string;

export function replaceUrlsInObject<T>(obj: T, replacer: UrlReplacer): T {
  return replaceUrls(obj, replacer) as T;
}

function replaceUrls(obj: unknown, replacer: UrlReplacer): unknown {
  if (typeof obj === 'string') {
    // Regex to match standard URLs and Markdown links
    const urlRegex = /(https?:\/\/[^\s)]+)/g;

    return obj.replace(urlRegex, replacer);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => replaceUrls(item, replacer));
  }

  if (typeof obj === 'object' && obj !== null) {
    const newObj: { [key: string]: unknown } = {};
    for (const [key, value] of Object.entries(obj)) {
      newObj[key] = replaceUrls(value, replacer);
    }

    return newObj;
  }

  return obj;
}
