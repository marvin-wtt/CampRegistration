import { computed, ref, shallowRef, watch, type Ref } from 'vue';
import { isDeepEqual } from '@/utils/deepEqual';

export interface DraftOptions<S, D> {
  /** Builds a fresh, independent editable copy of the source. */
  toDraft: (source: S) => D;
  /** Reduces a draft to what counts as a change before comparing. */
  normalize?: (draft: D) => unknown;
}

export interface Draft<D> {
  draft: Ref<D>;
  isModified: Readonly<Ref<boolean>>;
  /** Drops the edits and takes the source as it is now. */
  reset: () => void;
  /**
   * Runs a save and then takes what it stored, including fields the server
   * derives that the draft still holds the old value of.
   */
  save: <R>(fn: () => Promise<R>) => Promise<R>;
}

/**
 * An editable copy of `source` that follows it while it is unedited. Once
 * edited, a changed source (a reload, someone else's change) only moves the
 * baseline, so the edits survive — unless it now matches them.
 */
export function useDraft<S, D>(
  source: () => S | null | undefined,
  options: DraftOptions<S, D> & { initial: D },
): Draft<D>;
export function useDraft<S, D>(
  source: () => S | null | undefined,
  options: DraftOptions<S, D>,
): Draft<D | undefined>;
export function useDraft<S, D>(
  source: () => S | null | undefined,
  options: DraftOptions<S, D> & { initial?: D },
): Draft<D | undefined> {
  const normalize = options.normalize ?? ((draft: D) => draft);
  const baseline = shallowRef<D>();
  const draft = ref(options.initial) as Ref<D | undefined>;

  const isModified = computed<boolean>(
    () =>
      baseline.value !== undefined &&
      draft.value !== undefined &&
      !isDeepEqual(normalize(draft.value), normalize(baseline.value)),
  );

  function take(value: S) {
    baseline.value = options.toDraft(value);
    draft.value = options.toDraft(value);
  }

  watch(
    source,
    (value) => {
      if (value == null) {
        return;
      }
      const next = options.toDraft(value);
      const keepEdits =
        isModified.value &&
        !isDeepEqual(normalize(draft.value as D), normalize(next));
      if (keepEdits) {
        baseline.value = next;
      } else {
        take(value);
      }
    },
    { immediate: true },
  );

  function reset() {
    const value = source();
    if (value != null) {
      take(value);
    }
  }

  async function save<R>(fn: () => Promise<R>): Promise<R> {
    const result = await fn();
    reset();
    return result;
  }

  return { draft, isModified, reset, save };
}
