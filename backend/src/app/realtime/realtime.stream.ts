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
  /**
   * The subscriber's own event-manager row id. Used to scope permission
   * refreshes: a `manager` event only requires re-resolving connections whose
   * `managerId` matches the changed record — a role/expiry change can only
   * ever affect the permissions of that one manager, never anyone else's.
   */
  managerId: string;
  permissions: ReadonlySet<Permission>;
  /** Event-manager expiry; `null` = never expires. */
  expiresAt: Date | null;
  /**
   * Re-resolve this subscriber on every heartbeat rather than only when a
   * `manager` event names their record.
   *
   * Set for authorizations that draw (partly) on organization membership:
   * organization role changes emit no realtime event, so `shouldRefreshOn`
   * would never fire and a demoted organization administrator would keep their
   * snapshot for the life of the connection. Bounds that staleness to one
   * heartbeat instead.
   */
  revalidate?: boolean;
}

/**
 * Resolves the connecting subscriber's current authorization. Returning `null`
 * means the user is no longer a (non-expired) manager of the route's event and
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

// A given event object is dispatched to every local connection subscribed to
// its event (the bus emits the same reference to all listeners in one process
// — see MemoryRealtimeBus/RedisRealtimeBus). Cache the serialized SSE frame
// per event so N connections share one JSON.stringify instead of each doing
// their own. WeakMap keys are released once the event is no longer
// referenced by the bus (after all listeners have run), so this never leaks.
const serializedFrames = new WeakMap<RealtimeEvent, string>();

function serialize(event: RealtimeEvent): string {
  let frame = serializedFrames.get(event);
  if (frame === undefined) {
    frame = `data: ${JSON.stringify(event)}\n\n`;
    serializedFrames.set(event, frame);
  }
  return frame;
}

/**
 * Whether a `manager` event should trigger a permission refresh for this
 * subscriber: only when it's their own event-manager record that changed — a
 * role/expiry change can only ever affect that one manager's own permissions.
 */
export function shouldRefreshOn(
  event: RealtimeEvent,
  subscriber: RealtimeSubscriber,
): boolean {
  return event.resource === 'manager' && event.id === subscriber.managerId;
}

/**
 * Builds the SSE request handler streaming all realtime events of the route's
 * event (`:eventId`), filtered per event against the subscriber's permission set
 * (see {@link shouldDeliver}). Connect access must still be gated by a route
 * guard (e.g. `guard(eventManager('event.view'))`).
 *
 * The permission set is resolved once at connect and refreshed whenever a
 * `manager` event for *this subscriber's own* event-manager record arrives
 * (identified by `event.id === subscriber.managerId`) — a role/expiry change
 * can only ever affect that one manager's own permissions, so other
 * subscribers' connections don't need to re-verify. The refresh check runs
 * independently of {@link shouldDeliver}, so a subscriber lacking
 * `event.managers.view` still has their own permissions refreshed even though
 * they'd never see the event itself.
 *
 * Staleness window: between a role change committing and the async refresh
 * completing — one bus hop plus one DB round-trip (typically milliseconds),
 * the same freshness class as a REST request's guard check. During the window,
 * events are filtered with the old permission set. Fail-closed: if the
 * resolver returns `null` (manager removed or expired) **or throws**, the
 * stream ends — the client's `EventSource` reconnects (retry: 5000) and the
 * connect guard re-validates, so no events are ever delivered under an
 * unverifiable permission set.
 *
 * Expiry (`expiresAt`) is checked both reactively (on every delivered event)
 * and proactively (on every heartbeat tick, `HEARTBEAT_INTERVAL_MS`), so an
 * expired manager's connection is closed within one heartbeat cycle even on
 * an otherwise-idle event, rather than lingering until some unrelated event.
 */
export function realtimeStream(
  resolveSubscriber: SubscriberResolver,
): RequestHandler {
  const realtimeService = resolve(RealtimeService);

  return async (req: Request, res: Response) => {
    const eventId = req.modelOrFail('event').id;

    // Belt-and-braces: the route guard already proved `event.view`.
    let subscriber = await resolveSubscriber(req);
    if (subscriber === null) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
    }

    // Never throw outward: the dispatch listener runs synchronously inside the
    // publisher's `emit`, so a write to a dead/finished socket must not unwind
    // into the emitting request or block delivery to the event's other clients.
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
          // Fail closed: permissions can no longer be verified, so end the
          // stream instead of continuing with a possibly stale set. The
          // client's EventSource reconnects and the connect guard
          // re-validates.
          logger.warn(
            'Failed to refresh realtime subscriber permissions — ending stream',
            error,
          );
          close();
        })
        .finally(() => {
          refreshing = false;
          if (rerunRefresh) {
            rerunRefresh = false;
            refresh();
          }
        });
    };

    const unsubscribe = realtimeService.subscribe(eventId, (event) => {
      if (subscriber === null || isExpired(subscriber)) {
        close();
        return;
      }

      // Refresh regardless of whether the event is deliverable to them (see
      // doc comment above).
      if (shouldRefreshOn(event, subscriber)) {
        refresh();
      }

      if (!shouldDeliver(event, subscriber)) {
        return;
      }

      send(serialize(event));
    });

    const heartbeat = setInterval(() => {
      // Proactively catch an expiry that no event happened to trigger a check
      // for — otherwise a connection outlasting its manager's expiry on an
      // idle event would only ever be caught reactively (see doc comment).
      if (subscriber === null || isExpired(subscriber)) {
        close();
        return;
      }
      // Organization-derived permissions have no event to react to, so they are
      // re-resolved on the heartbeat instead (see `revalidate`).
      if (subscriber.revalidate) {
        refresh();
      }
      send(': heartbeat\n\n');
    }, HEARTBEAT_INTERVAL_MS);

    req.on('close', close);
  };
}
