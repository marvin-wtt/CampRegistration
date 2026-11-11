import { useRoute } from 'vue-router';

/** The scope key of a route param, e.g. `useRouteKey('eventId')`. */
export function useRouteKey(param: string): () => string | undefined {
  // Undefined outside a router (e.g. a component test): no scope is open.
  const route = useRoute() as ReturnType<typeof useRoute> | undefined;
  return () => {
    const value = route?.params[param];
    const key = Array.isArray(value) ? value[0] : value;
    return key && key.length > 0 ? key : undefined;
  };
}
