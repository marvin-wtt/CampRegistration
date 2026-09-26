import { beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  assignPageOrientation,
  LANDSCAPE_CLASS_NAME,
  orientationClassForWidth,
  PORTRAIT_CLASS_NAME,
  printOrientationClass,
} from '@/pages/print/pageOrientation';

// A4 portrait minus the 12mm @page margins is 186mm ≈ 703px.
const FITS_PORTRAIT_PX = 700;
const TOO_WIDE_FOR_PORTRAIT_PX = 800;

function createSheet(className = ''): HTMLElement {
  const sheet = document.createElement('section');
  sheet.className = ['print-sheet', className].filter(Boolean).join(' ');
  sheet.appendChild(document.createElement('table'));
  document.body.appendChild(sheet);

  return sheet;
}

describe('pageOrientation', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('printOrientationClass', () => {
    it('maps an explicit template orientation to its sheet class', () => {
      expect(printOrientationClass('portrait')).toBe(PORTRAIT_CLASS_NAME);
      expect(printOrientationClass('landscape')).toBe(LANDSCAPE_CLASS_NAME);
    });

    it('leaves the sheet unclassed for auto', () => {
      expect(printOrientationClass(undefined)).toBe('');
    });
  });

  describe('orientationClassForWidth', () => {
    it('keeps a table that fits the printable width portrait', () => {
      expect(orientationClassForWidth(FITS_PORTRAIT_PX)).toBe(
        PORTRAIT_CLASS_NAME,
      );
    });

    it('turns a wider table landscape', () => {
      expect(orientationClassForWidth(TOO_WIDE_FOR_PORTRAIT_PX)).toBe(
        LANDSCAPE_CLASS_NAME,
      );
    });
  });

  describe('assignPageOrientation', () => {
    it.each([PORTRAIT_CLASS_NAME, LANDSCAPE_CLASS_NAME])(
      'does not touch a sheet already set to %s',
      (className) => {
        const sheet = createSheet(className);

        assignPageOrientation();

        expect(sheet.className.split(' ')).toEqual(['print-sheet', className]);
      },
    );

    it('assigns an orientation to a sheet that has none', () => {
      const sheet = createSheet();

      assignPageOrientation();

      expect(
        sheet.classList.contains(PORTRAIT_CLASS_NAME) ||
          sheet.classList.contains(LANDSCAPE_CLASS_NAME),
      ).toBe(true);
    });

    it('falls back to portrait when the sheet holds no table', () => {
      const sheet = createSheet();
      sheet.querySelector('table')?.remove();

      assignPageOrientation();

      expect(sheet.classList.contains(PORTRAIT_CLASS_NAME)).toBe(true);
    });
  });

  describe('print layout', () => {
    // The class names are the contract between this module and the @page rules
    // in PrintLayout; nothing else ties them together.
    const layout = readFileSync(
      resolve(process.cwd(), 'src/layouts/PrintLayout.vue'),
      'utf8',
    );

    const namedPageFor = (className: string): string | undefined =>
      layout.match(
        new RegExp(String.raw`\.${className}\s*\{\s*page:\s*([\w-]+);`),
      )?.[1];

    it('maps the portrait sheet class to an A4 portrait page', () => {
      const page = namedPageFor(PORTRAIT_CLASS_NAME);

      expect(page).toBeDefined();
      expect(layout).toMatch(
        new RegExp(String.raw`@page ${page}\s*\{\s*size:\s*A4 portrait;`),
      );
    });

    it('maps the landscape sheet class to an A4 landscape page', () => {
      const page = namedPageFor(LANDSCAPE_CLASS_NAME);

      expect(page).toBeDefined();
      expect(layout).toMatch(
        new RegExp(String.raw`@page ${page}\s*\{\s*size:\s*A4 landscape;`),
      );
    });
  });
});
