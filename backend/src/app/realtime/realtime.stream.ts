import type { Request, RequestHandler, Response } from 'express';
import type { RealtimeResource } from '@camp-registration/common/realtime';
import { RealtimeService } from '#core/realtime/RealtimeService';
import { resolve } from '#core/ioc/container';

// Proxies (and the compression middleware) may buffer the stream; a periodic
// comment keeps the connection alive and flushes any buffer.
const HEARTBEAT_INTERVAL_MS = 25_000;

/**
 * Builds an SSE request handler that streams realtime events for the given
 * resources of the route's camp (`:campId`).
 *
 * Access must be gated by a route guard (e.g. `guard(campManager('camp.view'))`)
 * — this handler performs no permission checks itself. Feature modules mount
 * their own streams with their own guard + resources, so the realtime module
 * never depends on feature modules.
 */
export function realtimeStream(
  ...resources: RealtimeResource[]
): RequestHandler {
  const realtimeService = resolve(RealtimeService);
  const allowed = new Set(resources);

  return (req: Request, res: Response) => {
    const campId = req.modelOrFail('camp').id;

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

    const unsubscribe = realtimeService.subscribe(campId, (event) => {
      if (!allowed.has(event.resource)) {
        return;
      }
      send(`data: ${JSON.stringify(event)}\n\n`);
    });

    const heartbeat = setInterval(() => {
      send(': heartbeat\n\n');
    }, HEARTBEAT_INTERVAL_MS);

    req.on('close', () => {
      clearInterval(heartbeat);
      unsubscribe();
      res.end();
    });
  };
}
