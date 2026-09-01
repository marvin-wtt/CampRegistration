import type { RequestHandler } from 'express';
import { bindModelFromBody } from '#core/router/router';
import { resolve } from '#core/ioc/container';
import { ChoreService } from '#app/chore/chore.service';

/**
 * Binds the chore named by `choreId` in the request body, for the routes that
 * take it there rather than in the path (see choreAssignment.routes.ts — the
 * chore reference is a mutable field of the assignment, not part of its
 * identity, so it lives in the body like `date`/`slot`). Place it before the
 * route guard, same as `organizationFromBody()`.
 *
 * `choreId` is required on create, which is the only route this is used for —
 * on update it's optional, so the manual `choreId !== undefined` check in the
 * controller stays for that route instead.
 */
export const choreFromBody = (): RequestHandler =>
  bindModelFromBody('chore', 'choreId', (req, id) => {
    const event = req.model('event');
    return event ? resolve(ChoreService).getChoreById(event.id, id) : null;
  });
