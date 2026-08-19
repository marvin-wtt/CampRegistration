import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSheetDrag, type PanDetails } from '@/composables/sheetDrag';

// 15% of this is 120px, the distance past which a release dismisses.
const VIEWPORT_HEIGHT = 800;

// Slow enough not to count as a flick, so only distance decides.
const SLOW = 900;

function pan(details: Partial<PanDetails> = {}): PanDetails {
  return {
    direction: 'down',
    duration: SLOW,
    ...details,
    offset: { x: 0, y: 0, ...details.offset },
  };
}

function scrolledTo(top: number): HTMLElement {
  return { scrollTop: top } as HTMLElement;
}

beforeEach(() => {
  window.innerHeight = VIEWPORT_HEIGHT;
});

describe('useSheetDrag', () => {
  it('follows the finger down', () => {
    const { drag, offset, dragging } = useSheetDrag(vi.fn());

    drag(pan({ isFirst: true, offset: { y: 40 } }));
    expect(offset.value).toBe(40);
    expect(dragging.value).toBe(true);

    drag(pan({ offset: { y: 90 } }));
    expect(offset.value).toBe(90);
  });

  it('does not lift off its resting position', () => {
    const { drag, offset } = useSheetDrag(vi.fn());

    drag(pan({ isFirst: true, direction: 'up', offset: { y: -120 } }));

    expect(offset.value).toBe(0);
  });

  it('springs back when released short of the threshold', () => {
    const dismiss = vi.fn();
    const { drag, offset, dragging } = useSheetDrag(dismiss);

    drag(pan({ isFirst: true, offset: { y: 100 } }));
    drag(pan({ isFinal: true, offset: { y: 100 } }));

    expect(dismiss).not.toHaveBeenCalled();
    expect(offset.value).toBe(0);
    expect(dragging.value).toBe(false);
  });

  it('dismisses when released past the threshold', () => {
    const dismiss = vi.fn();
    const { drag, offset } = useSheetDrag(dismiss);

    drag(pan({ isFirst: true, offset: { y: 140 } }));
    drag(pan({ isFinal: true, offset: { y: 140 } }));

    expect(dismiss).toHaveBeenCalledOnce();
    // Left where the finger did, for the hide animation to carry on from.
    expect(offset.value).toBe(140);
  });

  it('dismisses on a short quick flick', () => {
    const dismiss = vi.fn();
    const { drag } = useSheetDrag(dismiss);

    drag(pan({ isFirst: true, offset: { y: 48 } }));
    drag(pan({ isFinal: true, duration: 120, offset: { y: 48 } }));

    expect(dismiss).toHaveBeenCalledOnce();
  });

  it('ignores a flick that barely moved', () => {
    const dismiss = vi.fn();
    const { drag } = useSheetDrag(dismiss);

    drag(pan({ isFirst: true, offset: { y: 12 } }));
    drag(pan({ isFinal: true, duration: 120, offset: { y: 12 } }));

    expect(dismiss).not.toHaveBeenCalled();
  });

  it('leaves the sheet alone while its content still has room to scroll', () => {
    const dismiss = vi.fn();
    const { dragFromContent, offset, scrollEl } = useSheetDrag(dismiss);
    scrollEl.value = scrolledTo(240);

    dragFromContent(pan({ isFirst: true, offset: { y: 200 } }));
    dragFromContent(pan({ isFinal: true, offset: { y: 200 } }));

    expect(offset.value).toBe(0);
    expect(dismiss).not.toHaveBeenCalled();
  });

  it('drags from content that is scrolled to the top', () => {
    const dismiss = vi.fn();
    const { dragFromContent, offset, scrollEl } = useSheetDrag(dismiss);
    scrollEl.value = scrolledTo(0);

    dragFromContent(pan({ isFirst: true, offset: { y: 60 } }));
    expect(offset.value).toBe(60);

    dragFromContent(pan({ isFinal: true, offset: { y: 200 } }));
    expect(dismiss).toHaveBeenCalledOnce();
  });

  it('keeps scrolling a gesture that began as a scroll', () => {
    const { dragFromContent, offset, scrollEl } = useSheetDrag(vi.fn());
    scrollEl.value = scrolledTo(0);

    // Starts upward — a scroll — so the rest of the gesture stays a scroll
    // even once the list hits its top and the finger turns around.
    dragFromContent(
      pan({ isFirst: true, direction: 'up', offset: { y: -30 } }),
    );
    dragFromContent(pan({ offset: { y: 150 } }));

    expect(offset.value).toBe(0);
  });

  it('forgets a drag once the sheet is closed', () => {
    const { drag, offset, dragging, reset } = useSheetDrag(vi.fn());

    drag(pan({ isFirst: true, offset: { y: 300 } }));
    reset();

    expect(offset.value).toBe(0);
    expect(dragging.value).toBe(false);
  });
});
