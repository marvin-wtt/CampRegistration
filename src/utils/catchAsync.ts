import { RequestHandler } from "express";
import { Request, Response, NextFunction } from "express-serve-static-core";

const catchAsync =
  (fn: RequestHandler) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err) => next(err));
  };

export default catchAsync;
