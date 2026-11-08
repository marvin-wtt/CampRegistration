export interface ApiErrorOptions {
  // Stable machine-readable error code (e.g. `EBADCSRFTOKEN`), surfaced to the
  // client so the frontend can react to specific errors without parsing the
  // human-readable message.
  code?: string;
  // The error this one wraps. Its stack is appended to the log output and
  // picked up by error trackers' linked-errors integrations.
  cause?: unknown;
  // Overrides the classification derived from the status code. Set `false` on a
  // 5xx that is anticipated rather than a bug — an upstream outage, say — to
  // keep it out of the error log and off the reporting pipeline.
  fault?: boolean;
  // Machine-readable facts the client needs to recover, e.g. the current
  // price after `REGISTRATION_PRICE_CHANGED`. Withheld with the message on a
  // masked fault.
  details?: Record<string, string | number | boolean | null>;
}

class ApiError extends Error {
  statusCode: number;
  readonly code: string | undefined;
  readonly details: ApiErrorOptions['details'];
  private readonly fault: boolean | undefined;

  constructor(
    statusCode: number,
    message?: string,
    options: ApiErrorOptions = {},
  ) {
    super(message, { cause: options.cause });
    this.statusCode = statusCode;
    this.code = options.code;
    this.details = options.details;
    this.fault = options.fault;
    Error.captureStackTrace(this, this.constructor);
  }

  // A bug or infrastructure failure rather than a rejected request: mask its
  // message from clients, log it and report it.
  get isFault(): boolean {
    return this.fault ?? this.statusCode >= 500;
  }
}

export default ApiError;
