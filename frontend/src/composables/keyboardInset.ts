import { onBeforeUnmount, ref, type Ref, watch } from 'vue';

/**
 * How far the on-screen keyboard covers the bottom of the layout viewport.
 *
 * Mobile browsers keep the layout viewport full-height when the keyboard
 * opens (only the visual viewport shrinks), so anything anchored with
 * `bottom: 0` — a bottom sheet — ends up behind the keyboard unless it is
 * lifted by this amount. Tracked only while `active` is true.
 */
export function useKeyboardInset(active: Ref<boolean>): Ref<number> {
  const inset = ref<number>(0);

  function update() {
    const viewport = window.visualViewport;

    inset.value = viewport
      ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
      : 0;
  }

  function stop() {
    window.visualViewport?.removeEventListener('resize', update);
    window.visualViewport?.removeEventListener('scroll', update);
    inset.value = 0;
  }

  watch(
    active,
    (isActive) => {
      const viewport = window.visualViewport;
      if (!viewport) {
        return;
      }

      if (isActive) {
        update();
        viewport.addEventListener('resize', update);
        viewport.addEventListener('scroll', update);
      } else {
        stop();
      }
    },
    { immediate: true },
  );

  onBeforeUnmount(stop);

  return inset;
}
