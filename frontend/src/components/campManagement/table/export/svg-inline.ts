export async function inlineSvgImages(root: HTMLElement): Promise<() => void> {
  const replacements: Array<{
    placeholder: SVGElement;
    original: HTMLImageElement;
  }> = [];

  // Limit to your flags, but you can broaden the selector if needed
  const imgs = Array.from(
    root.querySelectorAll<HTMLImageElement>('img.flag-icon[src$=".svg"]'),
  );

  // Fetch, parse, and replace
  for (const img of imgs) {
    try {
      // Same-origin since it's in /public; no CORS issues
      const res = await fetch(img.src);
      if (!res.ok) continue;
      const svgText = await res.text();

      const parser = new DOMParser();
      const doc = parser.parseFromString(svgText, 'image/svg+xml');
      let svgEl = doc.documentElement as unknown as SVGElement;

      // Import into current document
      svgEl = document.importNode(svgEl, true);

      // Copy sizing & classes so layout stays identical
      svgEl.setAttribute('class', img.className);
      // Maintain dimensions (prefer computed size if no explicit width)
      const cs = getComputedStyle(img);
      const width = img.getAttribute('width') ?? cs.width;
      const height = img.getAttribute('height') ?? cs.height;
      if (width && width !== 'auto') svgEl.setAttribute('width', width);
      if (height && height !== 'auto') svgEl.setAttribute('height', height);

      // Copy inline style if any
      if (img.getAttribute('style'))
        svgEl.setAttribute('style', img.getAttribute('style')!);

      img.replaceWith(svgEl);
      replacements.push({ placeholder: svgEl, original: img });
    } catch {
      // Ignore a failed flag; leave the <img> as-is
    }
  }

  // Return a function to restore the original <img> tags
  return () => {
    for (const { placeholder, original } of replacements) {
      placeholder.replaceWith(original);
    }
  };
}
