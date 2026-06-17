class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;
  // Stable machine-readable error code (e.g. `EBADCSRFTOKEN`), surfaced to the
  // client so the frontend can react to specific errors without parsing the
  // human-readable message.
  code: string | undefined;

  constructor(
    statusCode: number,
    message: string | undefined,
    isOperational = true,
    stack = '',
    code?: string,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;
