import type { NextFunction, Request, Response } from 'express';
import { CLIENT_ID_HEADER } from '@camp-registration/common/realtime';
import { runWithRequestContext } from '#core/context/requestContext';

// Originating client id (X-Client-Id header) used for realtime echo suppression.
const clientId = (req: Request): string | undefined => {
  const value = req.headers[CLIENT_ID_HEADER.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
};

/**
 * Establishes the ambient request context (AsyncLocalStorage) for the rest of
 * the request's async chain, so request-scoped values (e.g. the originating
 * client id that `RealtimeService` stamps onto event origins) are available in
 * deep layers without threading them through every signature.
 */
export default (req: Request, _res: Response, next: NextFunction) => {
  runWithRequestContext({ clientId: clientId(req) }, next);
};
