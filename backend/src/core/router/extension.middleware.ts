import type { NextFunction, Request, Response } from 'express';
import { routeModel, verifyModel } from '#core/router/model.middleware';
import { validateRequest } from '#core/router/validate.middleware';
import { authUserId } from '#core/auth/auth.middleware';
import { requestLocale } from '#core/i18n/i18n.middleware';

export default (req: Request, res: Response, next: NextFunction) => {
  // ---------------------------------------------------------------------------
  // Backwards compatibility with express 4.
  // ---------------------------------------------------------------------------

  // Validation fails otherwise due to body being undefined
  req.body = (req.body as unknown) ?? {};

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

  req.model = (key) => req.models[key];
  req.modelOrFail = (key) => routeModel(req.model(key));
  req.setModel = (key, value) => (req.models[key] = value);
  req.setModelOrFail = (key, value) => {
    req.setModel(key, verifyModel(value));
  };

  // ---------------------------------------------------------------------------
  // i18n
  // ---------------------------------------------------------------------------
  req.preferredLocale = () => requestLocale(req);

  // ---------------------------------------------------------------------------
  // Response
  // ---------------------------------------------------------------------------

  res.resource = (resource) => res.json(resource.toObject());

  // ---------------------------------------------------------------------------
  next();
};
