import type { Request } from 'express';

export const requestLocale = (req: Request): string => {
  const locale = req.acceptsLanguages()[0];

  // Replace wildcard with en-US
  if (locale.trim() === '*') {
    return 'en-US';
  }

  return locale;
};
