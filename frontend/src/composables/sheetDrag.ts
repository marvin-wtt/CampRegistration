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
  /**
   * With snap heights: the sheet's current height in pixels, `null` until
   * `reset()` has placed it at the first one.
   */
  height: Ref<number | null>;
  /** Bind to the scrollable body; read to decide whether it can be dragged. */
  scrollEl: Ref<HTMLElement | null>;
  /** Pan handler for the sheet's handle. */
  drag: (details: PanDetails) => void;
  /** Pan handler for the sheet's scrollable body. */
  dragFromContent: (details: PanDetails) => void;
  reset: () => void;
}

export interface SheetSnapOptions {
  /**
   * Resting heights in pixels, ascending; the sheet opens at the first.
   * Read at the start of every gesture, so it may depend on the viewport.
   */
  heights: () => number[];
}

/**
 * Drag-to-dismiss for a bottom sheet: the sheet follows the finger and is
 * either thrown away or let go of, rather than reacting to a single fling.
 *
 * `dismiss` is called instead of resetting the offset, so the sheet stays
 * where the finger left it and whatever hides it can animate on from there.
 *
 * With `snap`, dragging the handle also resizes the sheet between its snap
 * heights: released, it settles on the nearest one — or the next one in the
 * direction of a flick. Pulled below the lowest, it dismisses as above.
 */
export function useSheetDrag(
  dismiss: () => void,
  snap?: SheetSnapOptions,
): SheetDrag {
  const scrollEl = ref<HTMLElement | null>(null);
  const dragging = ref<boolean>(false);
  const offset = ref<number>(0);
  const height = ref<number | null>(null);
  // Decided on the first event of a gesture that starts in the body, and held
  // for the rest of it, so a drag never changes its mind halfway through.
  const contentDrags = ref<boolean>(false);
  // Snap heights and the height the gesture started from.
  let heights: number[] = [];
  let startHeight = 0;

  function isFlick(details: PanDetails, distance: number): boolean {
    return (
      (details.duration ?? 0) < FLICK_DURATION &&
      Math.abs(distance) > FLICK_DISTANCE
    );
  }

  // Past the lowest snap height (or with none), the offset decides.
  function releaseOffset(details: PanDetails) {
    const flicked =
      details.direction === 'down' && isFlick(details, offset.value);

    if (flicked || offset.value > window.innerHeight * DISMISS_RATIO) {
      dismiss();
      return;
    }

    offset.value = 0;
  }

  function releaseHeight(details: PanDetails, current: number) {
    const moved = current - startHeight;
    let target: number | undefined;

    if (isFlick(details, moved)) {
      target =
        details.direction === 'up'
          ? heights.find((h) => h > startHeight)
          : [...heights].reverse().find((h) => h < startHeight);
    }
    target ??= heights.reduce((best, h) =>
      Math.abs(h - current) < Math.abs(best - current) ? h : best,
    );
    height.value = target;
  }

  function drag(details: PanDetails) {
    if (details.isFirst) {
      dragging.value = true;
      if (snap) {
        heights = snap.heights();
        startHeight = height.value ?? heights[0] ?? 0;
      }
    }

    const dy = details.offset?.y ?? 0;
    const lowest = heights[0];
    const highest = heights.at(-1);

    if (!snap || lowest === undefined || highest === undefined) {
      // Upward drag does nothing: the sheet is already as tall as it gets.
      offset.value = Math.max(0, dy);
    } else {
      // Above the lowest snap height the sheet resizes; below it, it moves.
      const raw = startHeight - dy;
      height.value = Math.min(Math.max(raw, lowest), highest);
      offset.value = Math.max(0, lowest - raw);
    }

    if (details.isFinal !== true) {
      return;
    }

    dragging.value = false;

    if (!snap || offset.value > 0) {
      releaseOffset(details);
      return;
    }
    releaseHeight(details, height.value ?? startHeight);
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
    height.value = snap ? (snap.heights()[0] ?? null) : null;
  }

  return { dragging, offset, height, scrollEl, drag, dragFromContent, reset };
}
