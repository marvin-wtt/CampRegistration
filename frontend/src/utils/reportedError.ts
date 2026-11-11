// Errors already shown to the user. They still reject, so follow-ups after a
// failed call are skipped, but nothing reports them a second time: the
// reported-errors boot file and PageStateHandler let them pass.
const reportedErrors = new WeakSet<object>();

export function markReported<E>(error: E): E {
  if (typeof error === 'object' && error !== null) {
    reportedErrors.add(error);
  }
  return error;
}

export function isReportedError(error: unknown): boolean {
  return (
    typeof error === 'object' && error !== null && reportedErrors.has(error)
  );
}

// Primitives can't be marked, so they are wrapped first.
export function asReportedError(error: unknown): object {
  return markReported(
    typeof error === 'object' && error !== null
      ? error
      : new Error(String(error)),
  );
}
