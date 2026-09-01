import { computed, type ComputedRef } from 'vue';
import type { QFieldSlots } from 'quasar';

type PassthroughProps = ComputedRef<Record<string, unknown>>;

// The slots a field wrapper hands to the input it wraps. A loop rendering them
// cannot tell which slot it is rendering, so only the ones without a scope can
// be forwarded — which is every field slot except `control`.
export type ForwardedFieldSlots = Omit<QFieldSlots, 'control'>;

// A wrapper that types its own API after the component it wraps (e.g.
// `defineProps<QInputProps>()`) takes those props out of `attrs`, so attribute
// fallthrough no longer passes them on — this hands them to the inner component
// instead.
//
// Models are always left out, together with the props the wrapper handles
// itself: they are bound explicitly, and forwarding them would overwrite that
// binding. Naming a model in `exclude` drops its modifiers as well.
export function usePassthroughProps<T extends object>(
  props: T,
  exclude: readonly string[] = [],
): PassthroughProps {
  const excluded = new Set([
    'modelValue',
    'modelModifiers',
    ...exclude,
    ...exclude.map((key) => `${key}Modifiers`),
  ]);

  return computed(() =>
    Object.fromEntries(
      Object.entries(props).filter(([key]) => !excluded.has(key)),
    ),
  );
}
