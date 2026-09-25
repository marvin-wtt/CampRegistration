import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Ambient context of a running background job (queue job or scheduled task),
 * propagated through its whole async call chain. The logger stamps it onto
 * every entry, so log lines from shared code reached by a job are attributable.
 */
export interface JobContext {
  source: 'queue' | 'scheduler';
  name: string;
  queue?: string;
  id?: string;
  /** 1-based attempt number; queue jobs only. */
  attempt?: number;
}

const storage = new AsyncLocalStorage<JobContext>();

export function runWithJobContext<T>(context: JobContext, fn: () => T): T {
  return storage.run(context, fn);
}

export function getJobContext(): JobContext | undefined {
  return storage.getStore();
}
