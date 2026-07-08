import { useRoute } from 'vue-router';

interface EnumQueryParamOptions {
  caseInsensitive?: boolean;
}

export function useRouteQueryParams() {
  const route = useRoute();

  /**
   * Returns a query parameter only when it occurs exactly once and has a
   * string value.
   *
   * Examples:
   *   ?name=Marvin       -> "Marvin"
   *   ?name=             -> ""
   *   ?name              -> null
   *   ?name=a&name=b     -> null
   */
  function getStringQueryParam(field: string): string | null {
    const value = route.query[field];

    return typeof value === 'string' ? value : null;
  }

  /**
   * Returns the matching value from `values`.
   *
   * Returning the array entry rather than casting the query parameter ensures
   * that the result really is T.
   */
  function getEnumQueryParam<const T extends string>(
    field: string,
    values: readonly T[],
    options: EnumQueryParamOptions = {},
  ): T | null {
    const queryValue = getStringQueryParam(field);

    if (queryValue === null) {
      return null;
    }

    if (!options.caseInsensitive) {
      return values.find((value) => value === queryValue) ?? null;
    }

    const normalizedQueryValue = queryValue.toLowerCase();

    return (
      values.find((value) => value.toLowerCase() === normalizedQueryValue) ??
      null
    );
  }

  /**
   * Recognizes "true" and "false", ignoring case and surrounding whitespace.
   */
  function getBooleanQueryParam(field: string): boolean | null {
    const queryValue = getStringQueryParam(field);

    if (queryValue === null) {
      return null;
    }

    switch (queryValue.trim().toLowerCase()) {
      case 'true':
      case '1':
        return true;

      case 'false':
      case '0':
        return false;

      default:
        return null;
    }
  }

  /**
   * Returns any finite JavaScript number.
   *
   * Empty strings, NaN and Infinity are rejected.
   */
  function getNumericQueryParam(field: string): number | null {
    const queryValue = getStringQueryParam(field);

    if (queryValue === null) {
      return null;
    }

    const normalizedQueryValue = queryValue.trim();

    if (normalizedQueryValue === '') {
      return null;
    }

    const number = Number(normalizedQueryValue);

    return Number.isFinite(number) ? number : null;
  }

  return {
    getStringQueryParam,
    getEnumQueryParam,
    getBooleanQueryParam,
    getNumericQueryParam,
  };
}
