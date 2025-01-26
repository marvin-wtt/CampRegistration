import { NextFunction, Request, Response } from 'express';
import { routeModel } from '#utils/verifyModel.js';

export default (req: Request, _res: Response, next: NextFunction) => {
  // Initialize models
  req.models = {};

  // eslint-disable-next-line security/detect-object-injection
  req.model = (key) => routeModel(req.models[key]);

  next();
};
