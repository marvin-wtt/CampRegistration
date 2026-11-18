import ExcelJS from 'exceljs';

export type CellValue = string | number | Date | null;

export interface SheetColumn {
  header: string;
  /** Characters; a guess is fine, Excel users resize anyway. */
  width?: number;
  /** An Excel number format, e.g. `#,##0.00` or `yyyy-mm-dd`. */
  numFmt?: string;
}

export interface Sheet {
  name: string;
  columns: SheetColumn[];
  rows: CellValue[][];
  /** Rows set apart below the data, e.g. totals. */
  footer?: CellValue[][];
}

/** One workbook, a tab per sheet, header row frozen and bold. */
export async function toXlsx(sheets: Sheet[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  for (const sheet of sheets) {
    // Excel refuses tab names over 31 characters or with []:*?/\.
    const name = sheet.name.replace(/[[\]:*?/\\]/g, ' ').slice(0, 31);
    const worksheet = workbook.addWorksheet(name, {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    worksheet.columns = sheet.columns.map((column) => ({
      header: column.header,
      width: column.width ?? 14,
      style: column.numFmt ? { numFmt: column.numFmt } : {},
    }));
    worksheet.getRow(1).font = { bold: true };

    worksheet.addRows(sheet.rows);
    if (sheet.footer?.length) {
      worksheet.addRow([]);
      for (const values of sheet.footer) {
        worksheet.addRow(values).font = { bold: true };
      }
    }
  }

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

// Tells Excel the file is UTF-8; built from its code point to stay visible.
const BOM = String.fromCharCode(0xfeff);

function csvCell(value: CellValue): string {
  if (value === null) {
    return '';
  }
  const text =
    value instanceof Date ? value.toISOString().slice(0, 10) : String(value);

  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/**
 * RFC 4180 CSV of one sheet, with a byte-order mark so Excel reads UTF-8.
 * Numbers are written as plain decimals.
 */
export function toCsv(sheet: Sheet): string {
  const lines = [
    sheet.columns.map((column) => csvCell(column.header)),
    ...sheet.rows.map((row) => row.map(csvCell)),
  ].map((cells) => cells.join(','));

  return `${BOM}${lines.join('\r\n')}\r\n`;
}
