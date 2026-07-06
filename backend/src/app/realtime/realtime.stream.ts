import type { Request, RequestHandler, Response } from 'express';
import httpStatus from 'http-status';
import type { RealtimeEvent } from '@camp-registration/common/realtime';
import type { Permission } from '@camp-registration/common/permissions';
import { RealtimeService } from '#core/realtime/RealtimeService';
import { resolve } from '#core/ioc/container';
import ApiError from '#utils/ApiError';
import logger from '#core/logger';

// Proxies (and the compression middleware) may buffer the stream; a periodic
// comment keeps the connection alive and flushes any buffer.
const HEARTBEAT_INTERVAL_MS = 25_000;

/** A connected stream consumer's authorization snapshot. */
export interface RealtimeSubscriber {
  permissions: ReadonlySet<Permission>;
  /** Camp-manager expiry; `null` = never expires. */
  expiresAt: Date | null;
}

/**
 * Resolves the connecting subscriber's current authorization. Returning `null`
 * means the user is no longer a (non-expired) manager of the route's camp and
 * the stream must end. Injected by the mount site so the realtime module never
 * depends on feature modules.
 */
export type SubscriberResolver = (
  req: Request,
) => Promise<RealtimeSubscriber | null>;

/**
 * Whether an event may be delivered to a subscriber. Events carry the "view"
 * permission of their resource; the subscriber must hold it. Events without a
 * required permission are always delivered.
 */
export function shouldDeliver(
  event: RealtimeEvent,
  subscriber: RealtimeSubscriber,
): boolean {
  return (
    event.requiredPermission === undefined ||
    subscriber.permissions.has(event.requiredPermission)
  );
}

const isExpired = (subscriber: RealtimeSubscriber): boolean =>
  subscriber.expiresAt !== null && subscriber.expiresAt <= new Date();

/**
 * Builds the SSE request handler streaming all realtime events of the route's
 * camp (`:campId`), filtered per event against the subscriber's permission set
 * (see {@link shouldDeliver}). Connect access must still be gated by a route
 * guard (e.g. `guard(campManager('camp.view'))`).
 *
 * The permission set is resolved once at connect and refreshed whenever a
 * `manager` event for the camp arrives (someone's role may have changed —
 * including the subscriber's, so the refresh runs *before* permission
 * filtering, which would otherwise hide manager events from e.g. VIEWERs).
 *
 * Known staleness window: between a role change committing and the async
 * refresh completing (one DB round-trip), events are filtered with the old
 * permission set — the same window an already-issued REST response has.
 * If the resolver fails transiently, the old set is kept and the refresh is
 * retried on the next manager event; if it resolves to `null` (manager removed
 * or expired), the stream ends and the client's reconnect is rejected by the
 * connect guard.
 */
export function realtimeStream(
  resolveSubscriber: SubscriberResolver,
): RequestHandler {
  const realtimeService = resolve(RealtimeService);

  return async (req: Request, res: Response) => {
    const campId = req.modelOrFail('camp').id;

    // Belt-and-braces: the route guard already proved `camp.view`.
    let subscriber = await resolveSubscriber(req);
    if (subscriber === null) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
    }

    // Never throw outward: the dispatch listener runs synchronously inside the
    // publisher's `emit`, so a write to a dead/finished socket must not unwind
    // into the emitting request or block delivery to the camp's other clients.
    const send = (chunk: string): void => {
      if (res.writableEnded || res.destroyed) {
        return;
      }
      try {
        res.write(chunk);
        res.flush();
      } catch {
        // Peer went away between close detection and this write.
      }
    };

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      // Disable proxy buffering (nginx).
      'X-Accel-Buffering': 'no',
    });
    // Advise the client how long to wait before reconnecting.
    send('retry: 5000\n\n');

    let closed = false;
    const close = () => {
      if (closed) {
        return;
      }
      closed = true;
      clearInterval(heartbeat);
      unsubscribe();
      res.end();
    };

    // Serialized permission refresh: at most one resolver call in flight; a
    // manager event arriving mid-refresh queues exactly one rerun.
    let refreshing = false;
    let rerunRefresh = false;
    const refresh = () => {
      if (closed) {
        return;
      }
      if (refreshing) {
        rerunRefresh = true;
        return;
      }
      refreshing = true;
      resolveSubscriber(req)
        .then((next) => {
          if (next === null) {
            // No longer a manager — end the stream; the reconnect attempt is
            // rejected by the connect guard.
            close();
            return;
          }
          subscriber = next;
        })
        .catch((error: unknown) => {
          // Transient failure: keep the (possibly stale) set and retry on the
          // next manager event.
          logger.warn(
            'Failed to refresh realtime subscriber permissions',
            error,
          );
        })
        .finally(() => {
          refreshing = false;
          if (rerunRefresh) {
            rerunRefresh = false;
            refresh();
          }
        });
    };

    const unsubscribe = realtimeService.subscribe(campId, (event) => {
      // A manager change may have altered the subscriber's own role — refresh
      // regardless of whether this event is deliverable to them.
      if (event.resource === 'manager') {
        refresh();
      }

      if (subscriber === null || isExpired(subscriber)) {
        close();
        return;
      }

      if (!shouldDeliver(event, subscriber)) {
        return;
      }

      send(`data: ${JSON.stringify(event)}\n\n`);
    });

    const heartbeat = setInterval(() => {
      send(': heartbeat\n\n');
    }, HEARTBEAT_INTERVAL_MS);

    req.on('close', close);
  };
}
