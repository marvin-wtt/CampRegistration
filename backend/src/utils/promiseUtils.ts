import logger from '#config/logger';

export async function catchAndResolve<T>(
  promise: Promise<T>,
): Promise<void | T> {
  return promise.catch((error) => {
    logger.error('Error caught silent:', error);
  });
}
