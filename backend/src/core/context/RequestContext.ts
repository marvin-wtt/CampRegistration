import { AsyncLocalStorage } from 'node:async_hooks';
import { injectable } from 'inversify';

export interface RequestContextStore {
  // Authenticated user id, when the action originates from a request.
  // Absent for anonymous requests and non-request callers (queues, seeders).
  userId?: string;
  ip?: string;
  sessionId?: string;
}

/**
 * Request-scoped context backed by AsyncLocalStorage.
 *
 * Bound as a DI singleton (see `container.ts`), but the per-request isolation
 * comes from the underlying AsyncLocalStorage — so services can read the acting
 * user without threading it through every method signature. Callers outside an
 * HTTP request (BullMQ jobs, seeders) simply observe an empty store.
 */
@injectable()
export class RequestContext {
  private readonly storage = new AsyncLocalStorage<RequestContextStore>();

  run<T>(store: RequestContextStore, callback: () => T): T {
    return this.storage.run(store, callback);
  }

  get(): RequestContextStore | undefined {
    return this.storage.getStore();
  }

  get userId(): string | undefined {
    return this.storage.getStore()?.userId;
  }

  get ip(): string | undefined {
    return this.storage.getStore()?.ip;
  }
}
