import { NextFunction, Request, Response } from 'express';
import * as process from 'node:process';

export default (req: Request, res: Response, next: NextFunction) => {
  if (process.env.MAINTENANCE_MODE === 'true') {
    const retryAfterTime = 3 * 60;
    res.setHeader('Retry-After', retryAfterTime).sendStatus(503);
  } else {
    next();
  }
};
