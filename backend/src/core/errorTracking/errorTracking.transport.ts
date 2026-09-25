import Transport from 'winston-transport';
import { SPLAT } from 'triple-beam';
import { errorTrackingRegistry } from '#core/errorTracking/errorTracking.registry';
import type { JobContext } from '#core/context/jobContext';

interface LogInfo {
  [SPLAT]?: unknown[];
  // Stamped by the logger's job context format; the async-local job context
  // itself may already be gone by the time a transport runs.
  job?: JobContext;
}

// Winston only keeps the logged value's own `instanceof Error` when it was
// the sole argument (`logger.error(err)`); `logger.error('msg', err)` merges
// its enumerable properties into a plain info object instead. The original
// value survives either way under the SPLAT symbol, so pull the Error from
// there when `info` itself no longer is one.
const extractError = (info: LogInfo): Error | undefined => {
  if (info instanceof Error) {
    return info;
  }

  return info[SPLAT]?.find((arg): arg is Error => arg instanceof Error);
};

// Centralizes error reporting behind the logger instead of scattering
// tracker calls through business code: anything logged at `error` level that
// carries an Error is reported to every configured tracker automatically.
export class ErrorTrackingTransport extends Transport {
  log(info: LogInfo, callback: () => void): void {
    setImmediate(() => this.emit('logged', info));

    const error = extractError(info);
    if (error) {
      errorTrackingRegistry.captureException(error, { job: info.job });
    }

    callback();
  }
}
