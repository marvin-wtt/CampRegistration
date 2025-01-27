import type { NextFunction, Request, Response } from 'express';
import { routeModel, verifyModel } from '#middlewares/model.middleware.js';
import { validateRequest } from '#middlewares/validate.middleware.js';
import { authUserId } from '#middlewares/auth.middleware.js';

export default (req: Request, _res: Response, next: NextFunction) => {
  // ---------------------------------------------------------------------------
  // Backwards compatibility with express 4.
  // ---------------------------------------------------------------------------

  // Validation fails otherwise due to body being undefined
  req.body = req.body ?? {};

  // ---------------------------------------------------------------------------
  // Auth
  // ---------------------------------------------------------------------------

  req.authUserId = () => authUserId(req);

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  req.validate = (schema) => validateRequest(req, schema);

  // ---------------------------------------------------------------------------
  // Model
  // ---------------------------------------------------------------------------

  // Initialize models
  req.models = {};

  // eslint-disable-next-line security/detect-object-injection
  req.model = (key) => req.models[key];
  req.modelOrFail = (key) => routeModel(req.model(key));
  // eslint-disable-next-line security/detect-object-injection
  req.setModel = (key, value) => (req.models[key] = value);
  req.setModelOrFail = (key, value) => req.setModel(key, verifyModel(value));

  // ---------------------------------------------------------------------------

  next();
};
