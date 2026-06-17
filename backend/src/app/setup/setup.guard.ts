import httpStatus from 'http-status';
import { type Request } from 'express';
import ApiError from '#utils/ApiError';
import { catchMiddlewareAsync } from '#utils/catchAsync';
import { resolve } from '#core/ioc/container';
import { SetupService } from '#app/setup/setup.service';

/**
 * Blocks the setup endpoint once the instance has an admin. The service also
 * re-checks inside a transaction to close the race between two concurrent
 * bootstrap requests; this guard rejects early with a clean 403.
 */
export const setupAvailable = catchMiddlewareAsync(async (_req: Request) => {
  const required = await resolve(SetupService).isSetupRequired();
  if (!required) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Setup already completed');
  }
});
