/**
 * Legacy: kept for forms saved before `{event.freePlaces}` was resolved to the
 * registration's country. New forms compare it directly
 * (`{event.freePlaces} <= 0`); the country branch below only serves a
 * per-country record, which `setVariables` no longer provides.
 */
const isWaitingList = (params: unknown[]): boolean | null => {
  if (params.length === 0) {
    return null;
  }

  const freePlaces = params[0];
  if (typeof freePlaces === 'number') {
    return freePlaces <= 0;
  }

  // Country based free places
  if (params.length < 2) {
    return null;
  }

  const country = params[1];
  if (
    typeof country !== 'string' ||
    typeof freePlaces !== 'object' ||
    freePlaces === null
  ) {
    return null;
  }

  const countryFreePlaces = freePlaces as Record<string, unknown>;
  if (!(country in countryFreePlaces)) {
    return true;
  }

  const availableFreePlaces = countryFreePlaces[country];
  if (typeof availableFreePlaces !== 'number') {
    return null;
  }

  return availableFreePlaces <= 0;
};

export default isWaitingList;
