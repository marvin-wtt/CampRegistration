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

/** Rejects with `message` if `promise` has not settled within `ms`. */
export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string,
): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(message));
    }, ms);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}
