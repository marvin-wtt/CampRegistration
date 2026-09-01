import type { NextFunction, Request, Response } from 'express';
import { resolve } from '#core/ioc/container';
import { ActorContext } from '#core/context/ActorContext';

/**
 * Populates the request-scoped {@link ActorContext} store so downstream
 * services (e.g. the audit log) can attribute actions to the acting user.
 *
 * Must run after `passport.authenticate` (so `req.user` is populated) and after
 * the session middleware (so `req.sessionId` is set).
 */
export const actorContext = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  // `req.user` is populated by passport; it is absent for anonymous requests.
  const user: { id?: string } | undefined = req.user;

  resolve(ActorContext).run(
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

export default actorContext;
