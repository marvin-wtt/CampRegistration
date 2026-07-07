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
