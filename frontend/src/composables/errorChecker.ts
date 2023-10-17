export function hasResponse(e: unknown): e is { response: object } {
  return (
    e != null &&
    typeof e === 'object' &&
    'response' in e &&
    e.response != null &&
    typeof e.response === 'object'
  );
}

export function hasMessage(e: unknown): e is { message: string } {
  return (
    e != null && typeof e === 'object' && 'message' in e && e.message != null
  );
}

export function hasResponseStatusText(
  e: unknown,
): e is { response: { statusText: string } } {
  return (
    hasResponse(e) &&
    'statusText' in e.response &&
    e.response.statusText != null &&
    typeof e.response.statusText === 'string'
  );
}

export function hasResponseData(
  e: unknown,
): e is { response: { data: object } } {
  return (
    hasResponse(e) &&
    'data' in e.response &&
    typeof e.response.data === 'object'
  );
}

export function hasResponseDataErrors(
  e: unknown,
): e is { response: { data: { errors: object } } } {
  return (
    hasResponseData(e) &&
    'errors' in e.response.data &&
    typeof e.response.data.errors === 'object'
  );
}
