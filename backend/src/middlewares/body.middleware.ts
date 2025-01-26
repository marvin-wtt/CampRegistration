import { NextFunction, Request, Response } from 'express';

export default (req: Request, _res: Response, next: NextFunction) => {
  req.body = req.body ?? {};
  next();
};
