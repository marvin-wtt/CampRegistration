import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Per-request ambient context, established by the context middleware and
 * propagated through the whole async call chain of a request. Lets deep layers
 * (e.g. the realtime service stamping the event origin) access request-scoped
 * values without threading them through every signature.
 *
 * Code running outside a request (queue jobs, scheduler) has no context —
 * {@link getRequestContext} returns `undefined` there.
 */
export interface RequestContext {
  /** Originating client id (X-Client-Id header), for realtime echo suppression. */
  clientId?: string;
  /** Authenticated user, set once authentication has run; absent for anonymous requests. */
  userId?: string;
}

const storage = new AsyncLocalStorage<RequestContext>();

export function runWithRequestContext(
  context: RequestContext,
  fn: () => void,
): void {
  storage.run(context, fn);
}

export function getRequestContext(): RequestContext | undefined {
  return storage.getStore();
}

const memos = new WeakMap<RequestContext, Map<string, unknown>>();

/**
 * `compute()` once per request and key; outside a request, every call
 * computes. For values several layers of one request read, so they agree.
 *
 * Never invalidated: the value lives as long as the request's async work, so
 * cache only state the request itself does not write. Where a caller can hand
 * the value to the next call, pass it explicitly instead; this is for layers
 * with no call between them, such as a guard and the service behind it.
 */
export function perRequest<T>(key: string, compute: () => T): T {
  const store = storage.getStore();
  if (!store) {
    return compute();
  }

  let memo = memos.get(store);
  if (!memo) {
    memo = new Map();
    memos.set(store, memo);
  }
  if (!memo.has(key)) {
    memo.set(key, compute());
  }

  return memo.get(key) as T;
}

/** Adds values that only become known later in the chain, e.g. after authentication. */
export function extendRequestContext(values: Partial<RequestContext>): void {
  const store = storage.getStore();
  if (store) {
    Object.assign(store, values);
  }
}
