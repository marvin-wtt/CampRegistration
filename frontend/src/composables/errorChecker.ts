export function hasMessage(e: unknown): e is { message: string } {
  return (
    e != null && typeof e === 'object' && 'message' in e && e.message != null
  );
}
