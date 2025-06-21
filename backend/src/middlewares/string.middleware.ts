import type { Request, Response, NextFunction } from 'express';

function convertEmptyStringsToNull(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const transformObject = (obj: unknown): unknown => {
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
        transformed[key] = transformObject(transformed[key]); // Recursively handle nested objects
      }
    }

    return transformed;
  };

  // Apply transformation to the body
  req.body = transformObject(req.body);

  next();
}

export default convertEmptyStringsToNull;
