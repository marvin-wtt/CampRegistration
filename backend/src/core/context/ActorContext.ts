import { AsyncLocalStorage } from 'node:async_hooks';
import { injectable } from 'inversify';

export interface ActorContextStore {
  // Authenticated user id, when the action originates from a request.
  // Absent for anonymous requests and non-request callers (queues, seeders).
  userId?: string;
  ip?: string;
  sessionId?: string;
}

/**
 * Request-scoped actor context backed by AsyncLocalStorage.
 *
 * Bound as a DI singleton (see `container.ts`), but the per-request isolation
 * comes from the underlying AsyncLocalStorage — so services can read the acting
 * user without threading it through every method signature. Callers outside an
 * HTTP request (BullMQ jobs, seeders) simply observe an empty store.
 *
 * Separate from `#core/context/requestContext` (the plain-function ambient
 * context used for realtime echo suppression): that one is established before
 * authentication runs, while this one needs `req.user`/`req.sessionId` and so
 * is populated later in the middleware chain (see `actor-context.middleware`).
 */
@injectable()
export class ActorContext {
  private readonly storage = new AsyncLocalStorage<ActorContextStore>();

  run<T>(store: ActorContextStore, callback: () => T): T {
    return this.storage.run(store, callback);
  }

  get(): ActorContextStore | undefined {
    return this.storage.getStore();
  }

  get userId(): string | undefined {
    return this.storage.getStore()?.userId;
  }

  get ip(): string | undefined {
    return this.storage.getStore()?.ip;
  }
}
