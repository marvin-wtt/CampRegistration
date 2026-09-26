import { ref, type Ref } from 'vue';
import type { TouchPanValue } from 'quasar';

export type PanDetails = Parameters<NonNullable<TouchPanValue>>[0];

// Released below this share of the viewport the sheet springs back; past it,
// it goes. A short, fast flick dismisses regardless of how far it travelled —
// which is the difference between dragging a sheet and throwing it away.
const DISMISS_RATIO = 0.15;
const FLICK_DURATION = 250;
const FLICK_DISTANCE = 32;

export interface SheetDrag {
  /** True while a finger is on the sheet, so the transition can be turned off. */
  dragging: Ref<boolean>;
  /** How far the sheet currently sits below its resting position, in pixels. */
  offset: Ref<number>;
  /** Bind to the scrollable body; read to decide whether it can be dragged. */
  scrollEl: Ref<HTMLElement | null>;
  /** Pan handler for the sheet's handle. */
  drag: (details: PanDetails) => void;
  /** Pan handler for the sheet's scrollable body. */
  dragFromContent: (details: PanDetails) => void;
  reset: () => void;
}

/**
 * Drag-to-dismiss for a bottom sheet: the sheet follows the finger and is
 * either thrown away or let go of, rather than reacting to a single fling.
 *
 * `dismiss` is called instead of resetting the offset, so the sheet stays
 * where the finger left it and whatever hides it can animate on from there.
 */
export function useSheetDrag(dismiss: () => void): SheetDrag {
  const scrollEl = ref<HTMLElement | null>(null);
  const dragging = ref<boolean>(false);
  const offset = ref<number>(0);
  // Decided on the first event of a gesture that starts in the body, and held
  // for the rest of it, so a drag never changes its mind halfway through.
  const contentDrags = ref<boolean>(false);

  function drag(details: PanDetails) {
    if (details.isFirst) {
      dragging.value = true;
    }

    // Upward drag does nothing: the sheet is already as tall as it gets.
    offset.value = Math.max(0, details.offset?.y ?? 0);

    if (details.isFinal !== true) {
      return;
    }

    dragging.value = false;

    const flicked =
      details.direction === 'down' &&
      (details.duration ?? 0) < FLICK_DURATION &&
      offset.value > FLICK_DISTANCE;

    if (flicked || offset.value > window.innerHeight * DISMISS_RATIO) {
      dismiss();
      return;
    }

    offset.value = 0;
  }

  function dragFromContent(details: PanDetails) {
    if (details.isFirst) {
      // A drag that starts in the body scrolls it, unless it is already at the
      // top and the finger is heading down — then it takes the sheet with it.
      contentDrags.value =
        (scrollEl.value?.scrollTop ?? 0) <= 0 && details.direction === 'down';
    }

    if (contentDrags.value) {
      drag(details);
    }
  }

  function reset() {
    dragging.value = false;
    offset.value = 0;
    contentDrags.value = false;
  }

  return { dragging, offset, scrollEl, drag, dragFromContent, reset };
}
