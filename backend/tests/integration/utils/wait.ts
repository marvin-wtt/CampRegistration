export async function waitUntil(
  check: () => boolean | Promise<boolean>,
  opts: { timeout?: number; interval?: number } = {},
) {
  const timeout = opts.timeout ?? 2_000;
  const interval = opts.interval ?? 20;
  const started = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (await check()) {
      return;
    }
    if (Date.now() - started > timeout) {
      throw new Error(`waitUntil: timed out after ${timeout}ms`);
    }
    await wait(interval);
  }
}

export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
