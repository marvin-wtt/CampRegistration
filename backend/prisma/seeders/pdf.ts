const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN = 56;
const LINE_HEIGHT = 20;

function escapeText(value: string): string {
  return value.replace(/([\\()])/g, '\\$1');
}

/**
 * Writes a one-page PDF from a few lines of text. The seeded event documents
 * have to exist as real files on disk — the file API streams them from storage
 * — but a single Helvetica text object is all they need, so this stays a
 * handful of lines instead of a dependency.
 *
 * Text is encoded as Latin-1 to match the font's WinAnsiEncoding; stay within
 * that range (no typographic quotes or dashes).
 */
export function createPdf(lines: string[]): Buffer {
  const text = lines.map((line) => `(${escapeText(line)}) Tj T*`).join('\n');
  const content =
    `BT\n/F1 12 Tf\n${MARGIN.toString()} ${(PAGE_HEIGHT - MARGIN).toString()} Td\n` +
    `${LINE_HEIGHT.toString()} TL\n${text}\nET`;

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH.toString()} ${PAGE_HEIGHT.toString()}] ` +
      '/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    `<< /Length ${Buffer.byteLength(content, 'latin1').toString()} >>\nstream\n${content}\nendstream`,
  ];

  // The cross-reference table needs the byte offset of every object, so the
  // document is assembled once and measured as it grows.
  let pdf = '%PDF-1.4\n';
  const offsets = objects.map((body, index) => {
    const offset = Buffer.byteLength(pdf, 'latin1');
    pdf += `${(index + 1).toString()} 0 obj\n${body}\nendobj\n`;

    return offset;
  });

  const startXref = Buffer.byteLength(pdf, 'latin1');
  const size = objects.length + 1;

  pdf += `xref\n0 ${size.toString()}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    pdf += `${offset.toString().padStart(10, '0')} 00000 n \n`;
  }
  pdf +=
    `trailer\n<< /Size ${size.toString()} /Root 1 0 R >>\n` +
    `startxref\n${startXref.toString()}\n%%EOF\n`;

  return Buffer.from(pdf, 'latin1');
}
