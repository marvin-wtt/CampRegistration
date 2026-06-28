import type { NextFunction, Request, Response } from 'express';
import { resolve } from '#core/ioc/container';
import { RequestContext } from '#core/context/RequestContext';

/**
 * Populates the request-scoped {@link RequestContext} store so downstream
 * services (e.g. the audit log) can attribute actions to the acting user.
 *
 * Must run after `passport.authenticate` (so `req.user` is populated) and after
 * the session middleware (so `req.sessionId` is set).
 */
export const requestContext = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  // `req.user` is populated by passport; it is absent for anonymous requests.
  const user: { id?: string } | undefined = req.user;

  resolve(RequestContext).run(
    {
      userId: user?.id,
      ip: req.ip,
      sessionId: req.sessionId,
    },
    () => {
      next();
    },
  );
};

export default requestContext;
