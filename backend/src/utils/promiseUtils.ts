import logger from '#core/logger';

export async function catchAndResolve<T>(
  promise: Promise<T>,
): Promise<undefined | T> {
  return promise.catch((error: unknown) => {
    logger.error('Error caught silent');
    logger.error(error);
    return undefined;
  });
}
