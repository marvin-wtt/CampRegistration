/**
 * A client that hangs up mid-download makes `pipeline` destroy every stream in
 * the chain with this error — routine, not a server error.
 */
export const isClientDisconnect = (error: unknown): boolean =>
  error instanceof Error &&
  'code' in error &&
  error.code === 'ERR_STREAM_PREMATURE_CLOSE';
