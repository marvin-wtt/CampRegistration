import {
  computed,
  toValue,
  watch,
  type MaybeRefOrGetter,
  type WritableComputedRef,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useRouteQueryParams } from '@/composables/useRouteQueryParams';

interface RouteTabOptions<T extends string> {
  /** Query parameter name. Defaults to `tab`. */
  param?: string;
  /** Tab shown when the parameter is absent or unknown. Defaults to the first. */
  default?: T;
}

/**
 * Binds a tab selection to a query parameter so it survives reloads and can be
 * linked. The default tab is never written to the URL: a bare URL means "the
 * first tab", and an unknown value is treated as such and dropped.
 *
 * `values` may be reactive, so a page can pass only the tabs the current user
 * may see — a `?tab=` naming a tab they lost access to then falls back instead
 * of rendering a forbidden panel.
 */
export function useRouteTab<const T extends string>(
  values: MaybeRefOrGetter<readonly [T, ...T[]]>,
  options?: RouteTabOptions<NoInfer<T>>,
): WritableComputedRef<T>;
export function useRouteTab<const T extends string>(
  values: MaybeRefOrGetter<readonly T[]>,
  options?: RouteTabOptions<NoInfer<T>>,
): WritableComputedRef<T | undefined>;
export function useRouteTab<const T extends string>(
  values: MaybeRefOrGetter<readonly T[]>,
  options: RouteTabOptions<T> = {},
): WritableComputedRef<T | undefined> {
  const route = useRoute();
  const router = useRouter();
  const { getEnumQueryParam } = useRouteQueryParams();

  const param = options.param ?? 'tab';

  function fallback(): T | undefined {
    const available = toValue(values);

    return options.default !== undefined && available.includes(options.default)
      ? options.default
      : available[0];
  }

  function resolve(): T | undefined {
    return getEnumQueryParam(param, toValue(values)) ?? fallback();
  }

  function write(value: T | undefined): void {
    void router.replace({
      query: {
        ...route.query,
        [param]: value === fallback() ? undefined : value,
      },
    });
  }

  // Strip a parameter that is unknown or names the default, so the URL always
  // shows exactly what the "omit the default" rule would have written. Watched
  // rather than run once on mount because `values` may still be filling in from
  // the profile when the page mounts, and an empty list must not strip a
  // parameter that is about to become valid.
  watch(
    () => toValue(values),
    (available) => {
      const raw = route.query[param];
      if (raw === undefined || available.length === 0) {
        return;
      }

      const resolved = resolve();
      const canonical = resolved === fallback() ? undefined : resolved;
      if (raw !== canonical) {
        write(resolved);
      }
    },
    { immediate: true },
  );

  return computed({
    get: resolve,
    set: write,
  });
}
