import type { NextFunction, Request, Response } from 'express';
import config from '#config/index';

export default (_req: Request, res: Response, next: NextFunction) => {
  if (config.maintenanceMode) {
    const retryAfterTime = 3 * 60;
    res.setHeader('Retry-After', retryAfterTime).sendStatus(503);
  } else {
    next();
  }
};
