import { useRoute, useRouter, type LocationQuery } from 'vue-router';

type QueryParamValue = string | number | boolean | null | undefined;

interface EnumQueryParamOptions {
  caseInsensitive?: boolean;
}

export function useRouteQueryParams() {
  const route = useRoute();
  const router = useRouter();

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

  /**
   * Merges `params` into the current query string. `null`, `undefined` and empty
   * strings remove their key, so a filter reset leaves a clean URL.
   *
   * Navigates with `replace` rather than `push`: filter changes are not history
   * steps, and a debounced search would otherwise bury the previous page under
   * one entry per keystroke.
   */
  function setQueryParams(params: Record<string, QueryParamValue>): void {
    const query: LocationQuery = { ...route.query };

    for (const [field, value] of Object.entries(params)) {
      if (value === null || value === undefined || value === '') {
        delete query[field];
      } else {
        query[field] = String(value);
      }
    }

    // Vue Router still resolves and notifies on an identical target; skip it so
    // reactive writers can't loop.
    if (JSON.stringify(query) === JSON.stringify(route.query)) {
      return;
    }

    void router.replace({ query });
  }

  return {
    getStringQueryParam,
    getEnumQueryParam,
    getBooleanQueryParam,
    getNumericQueryParam,
    setQueryParams,
  };
}
