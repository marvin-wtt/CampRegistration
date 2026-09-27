import { onBeforeUnmount, watchSyncEffect, type Ref } from 'vue';

export type MarginBox =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

/** CSS `content` values keyed by margin box. */
export type MarginBoxes = Partial<Record<MarginBox, string>>;

export interface PageRuleOptions {
  name?: string;
  size?: string;
}

export const PAGE_COUNTER = "counter(page) ' / ' counter(pages)";

/** Quotes `text` as a CSS string literal for use in `content`. */
export function cssString(text: string): string {
  const escaped = text
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\r?\n/g, '\\A ');

  return `"${escaped}"`;
}

/**
 * Builds one `@page` rule. Chromium suppresses its own header/footer on every
 * edge that has an author margin box, so an edge left empty here still gets a
 * blank box.
 */
export function pageRule(
  boxes: MarginBoxes,
  options: PageRuleOptions = {},
): string {
  const filled: MarginBoxes = { ...boxes };
  const hasEdge = (edge: 'top' | 'bottom') =>
    Object.keys(filled).some((box) => box.startsWith(edge));
  if (!hasEdge('top')) {
    filled['top-center'] = '""';
  }
  if (!hasEdge('bottom')) {
    filled['bottom-center'] = '""';
  }

  const body = [
    options.size ? `size: ${options.size};` : '',
    ...Object.entries(filled).map(
      ([box, content]) => `@${box} { content: ${content}; }`,
    ),
  ].filter(Boolean);

  const selector = options.name ? `@page ${options.name}` : '@page';

  return `${selector} { ${body.join(' ')} }`;
}

let marginBoxSupport: boolean | undefined;

/** Whether the browser renders `@page` margin boxes (Firefox does not). */
export function supportsMarginBoxes(): boolean {
  if (marginBoxSupport === undefined) {
    try {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync('@page { @top-left { content: ""; } }');
      const rule = sheet.cssRules[0] as CSSGroupingRule | undefined;
      marginBoxSupport = (rule?.cssRules?.length ?? 0) > 0;
    } catch {
      marginBoxSupport = false;
    }
  }

  return marginBoxSupport;
}

/**
 * Keeps a `<style>` element in `<head>` in sync with `css` while mounted.
 * Synchronous, so values set in a print page's `prepare` apply before printing.
 */
export function usePageStyle(css: Ref<string>): void {
  const style = document.createElement('style');
  document.head.appendChild(style);

  watchSyncEffect(() => {
    style.textContent = css.value;
  });

  onBeforeUnmount(() => style.remove());
}
