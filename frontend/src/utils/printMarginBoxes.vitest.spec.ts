import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, nextTick, ref } from 'vue';
import {
  cssString,
  PAGE_COUNTER,
  pageRule,
  usePageStyle,
} from '@/utils/printMarginBoxes';

describe('cssString', () => {
  it('escapes quotes, backslashes and newlines', () => {
    expect(cssString('a "b" \\ c\nd')).toBe('"a \\"b\\" \\\\ c\\A d"');
  });
});

describe('pageRule', () => {
  it('fills an empty edge so the browser default stays hidden', () => {
    expect(pageRule({ 'bottom-right': PAGE_COUNTER })).toBe(
      `@page { @bottom-right { content: ${PAGE_COUNTER}; } @top-center { content: ""; } }`,
    );
  });

  it('leaves edges with a box untouched', () => {
    const rule = pageRule({ 'top-left': '"a"', 'bottom-left': '"b"' });

    expect(rule).not.toContain('top-center');
    expect(rule).not.toContain('bottom-center');
  });

  it('emits name and size for a named page', () => {
    expect(
      pageRule(
        { 'top-left': '"a"', 'bottom-left': '"b"' },
        { name: 'sheet-1', size: 'A4 landscape' },
      ),
    ).toMatch(/^@page sheet-1 \{ size: A4 landscape; /);
  });
});

describe('usePageStyle', () => {
  it('syncs a head style element while mounted', async () => {
    const css = ref('@page { size: A4; }');
    const wrapper = mount(
      defineComponent({
        setup() {
          usePageStyle(css);
          return () => null;
        },
      }),
    );

    const style = () =>
      Array.from(document.head.querySelectorAll('style')).find((el) =>
        el.textContent?.startsWith('@page'),
      );
    expect(style()?.textContent).toBe('@page { size: A4; }');

    css.value = '@page { size: A5; }';
    // Synchronous: no tick needed before printing.
    expect(style()?.textContent).toBe('@page { size: A5; }');

    wrapper.unmount();
    await nextTick();
    expect(style()).toBeUndefined();
  });
});
