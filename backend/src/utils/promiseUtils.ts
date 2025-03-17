import logger from '#core/logger';

export async function catchAndResolve<T>(
  promise: Promise<T>,
): Promise<void | T> {
  return promise.catch((error) => {
    logger.error('Error caught silent');
    logger.error(error);
  });
}
