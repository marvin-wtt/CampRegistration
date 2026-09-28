export const PORTRAIT_CLASS_NAME = 'print-sheet--portrait';
export const LANDSCAPE_CLASS_NAME = 'print-sheet--landscape';

export type PrintOrientation = 'portrait' | 'landscape';

// A4 portrait minus the 12mm @page margins declared in PrintLayout, at the
// fixed CSS resolution of 96px per inch.
const PORTRAIT_PRINTABLE_WIDTH_PX = ((210 - 2 * 12) / 25.4) * 96;

/** Class for a template that picked its orientation; empty string for auto. */
export function printOrientationClass(
  orientation: PrintOrientation | undefined,
): string {
  if (orientation === 'landscape') {
    return LANDSCAPE_CLASS_NAME;
  }
  if (orientation === 'portrait') {
    return PORTRAIT_CLASS_NAME;
  }

  return '';
}

export function orientationClassForWidth(minContentWidth: number): string {
  return minContentWidth > PORTRAIT_PRINTABLE_WIDTH_PX
    ? LANDSCAPE_CLASS_NAME
    : PORTRAIT_CLASS_NAME;
}

/**
 * Narrowest width the table can be squeezed into. `ResultTablePrint` sets
 * `table { width: 100% }`, so `scrollWidth` alone would report the viewport of
 * whatever iframe or window the print page happens to run in; forcing
 * `min-content` keeps the measurement intrinsic, and therefore identical on
 * every client.
 */
function measureMinContentWidth(table: HTMLTableElement): number {
  const width = table.style.width;
  table.style.width = 'min-content';
  const minContentWidth = table.scrollWidth;
  table.style.width = width;

  return minContentWidth;
}

/** Picks an orientation for every sheet that did not bring its own. */
export function assignPageOrientation(root: ParentNode = document): void {
  const sheets = root.querySelectorAll<HTMLElement>('.print-sheet');

  sheets.forEach((sheet) => {
    if (
      sheet.classList.contains(PORTRAIT_CLASS_NAME) ||
      sheet.classList.contains(LANDSCAPE_CLASS_NAME)
    ) {
      return;
    }

    // IMPORTANT: target the actual <table>, not q-table wrappers
    const table = sheet.querySelector<HTMLTableElement>('table');

    sheet.classList.add(
      table
        ? orientationClassForWidth(measureMinContentWidth(table))
        : PORTRAIT_CLASS_NAME,
    );
  });
}
