import { default as JsPdf } from 'jspdf';
import DomToImage, { Options } from 'dom-to-image';

export interface ExportOptions {
  scale?: number;
  captureWidth?: number;
  captureHeight?: number;

  page?: {
    name?: string;
    orientation?: 'portrait' | 'landscape';
    margin?: number | number[];
    footer?: string;
    header?: string;
  };
}

export interface Dimension {
  width: number;
  height: number;
}

export function scaleImage(
  input: Dimension,
  output: Dimension,
  orientation: 'portrait' | 'landscape',
): Dimension {
  let dim;
  if (orientation === 'portrait') {
    // Width first
    dim = scaleImageByWidth(input, output);

    return dim.height > output.height ? scaleImageByHeight(input, output) : dim;
  }

  if (orientation === 'landscape') {
    // Height first
    dim = scaleImageByHeight(input, output);

    return dim.width > output.width ? scaleImageByWidth(input, output) : dim;
  }

  // Cannot be reached
  return {
    width: 0,
    height: 0,
  };
}

function scaleImageByWidth(input: Dimension, output: Dimension): Dimension {
  const scale = input.width / output.width;

  return {
    width: output.width,
    height: input.height / scale,
  };
}

function scaleImageByHeight(input: Dimension, output: Dimension): Dimension {
  const scale = input.height / output.height;

  return {
    width: input.width / scale,
    height: output.height,
  };
}

function normalizeMargin(margin: number | number[]): number[] {
  if (typeof margin === 'number') {
    return [margin, margin, margin, margin];
  }

  if (margin.length == 4) {
    return margin;
  }

  if (margin.length == 2) {
    return [margin[0], margin[1], margin[0], margin[1]];
  }

  throw 'Invalid page margin';
}

export function createPDF() {
  // Create PDF
  const doc = new JsPdf({
    format: 'a4',
    unit: 'px',
    compress: true,
  });

  function save(filename?: string) {
    // The first page will always be blank, so we can delete it
    doc.deletePage(1);
    doc.save(filename);
  }

  async function addPage(node: HTMLElement, exportOptions?: ExportOptions) {
    // Assign default parameters
    exportOptions ??= {};
    exportOptions.captureWidth ??= node.clientWidth;
    exportOptions.captureHeight ??= node.clientHeight;
    exportOptions.page ??= {};
    exportOptions.page.name ??= 'table';
    exportOptions.page.orientation ??= 'portrait';
    exportOptions.page.margin ??= 20;

    doc.addPage('a4', exportOptions.page.orientation);

    const margin = normalizeMargin(exportOptions.page.margin);
    const input = {
      width: exportOptions.captureWidth,
      height: exportOptions.captureHeight,
    };
    const output = {
      width: doc.internal.pageSize.getWidth() - margin[1] - margin[3],
      height: doc.internal.pageSize.getHeight() - margin[0] - margin[2],
    };
    const dimension = scaleImage(input, output, exportOptions.page.orientation);
    const headerSpace = exportOptions.page.header ? 5 : 0;
    const pageOptions = {
      format: 'PNG',
      x: margin[3],
      y: margin[0] + headerSpace,
      width: dimension.width,
      height: dimension.height,
    };

    // Capture image
    const image = await createImage(node, exportOptions);
    doc.addImage(
      image,
      pageOptions.format,
      pageOptions.x,
      pageOptions.y,
      pageOptions.width,
      pageOptions.height,
      undefined,
      'FAST',
    );

    // Add header and footer
    const pageCenter = doc.internal.pageSize.getWidth() / 2;
    if (exportOptions.page.header) {
      const headerHeight = margin[0] + 1;

      doc.setFontSize(9);
      doc.text(exportOptions.page.header, pageCenter, headerHeight, {
        align: 'center',
      });
    }

    if (exportOptions.page.footer) {
      const footerHeight = doc.internal.pageSize.getHeight() - margin[2] - 1;

      doc.setFontSize(9);
      doc.text(exportOptions.page.footer, pageCenter, footerHeight, {
        align: 'center',
      });
    }
  }

  return {
    addPage,
    save,
  };
}

export async function createImage(
  node: Node,
  options: ExportOptions,
): Promise<HTMLImageElement> {
  const width = options.captureWidth ?? 0;
  const height = options.captureHeight ?? 0;

  // Scale dom to increase resolution
  const scale = options.scale ?? 1;
  const o: Options = {
    quality: 1,
    width: width * scale,
    height: height * scale,
    style: {
      transform: `scale(${scale})`,
      transformOrigin: 'top left',
    },
  };

  const dataUrl = await DomToImage.toPng(node, o);

  const img = new Image();
  img.src = dataUrl;

  return img;
}
