const isWaitingList = (params: unknown[]): boolean | null => {
  if (params.length === 0) {
    return null;
  }

  const freePlaces = params[0];
  if (typeof freePlaces === 'number') {
    return freePlaces > 0;
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
    return null;
  }

  const availableFreePlaces = countryFreePlaces[country];
  if (typeof availableFreePlaces !== 'number') {
    return null;
  }

  return availableFreePlaces > 0;
};

export default isWaitingList;
