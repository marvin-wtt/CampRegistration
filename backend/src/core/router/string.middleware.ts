import type { Request, Response, NextFunction } from 'express';

export function emptyStringsToNull(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const transformed = { ...obj } as Record<string, unknown>;

  for (const key in transformed) {
    if (transformed[key] === '') {
      transformed[key] = null;
    } else if (
      typeof transformed[key] === 'object' &&
      !Array.isArray(transformed[key])
    ) {
      transformed[key] = emptyStringsToNull(transformed[key]);
    }
  }

  return transformed;
}

/**
 * Multipart bodies are parsed per route, after this runs — the multipart
 * middleware applies {@link emptyStringsToNull} itself.
 */
function convertEmptyStringsToNull(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  req.body = emptyStringsToNull(req.body);

  next();
}

export default convertEmptyStringsToNull;
