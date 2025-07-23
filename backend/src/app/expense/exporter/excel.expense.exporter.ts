import ExcelJS, { type Worksheet, type CellValue } from 'exceljs';
import { PassThrough, type Writable, type Readable } from 'node:stream';

export class ExcelExporter {
  private workbook = new ExcelJS.Workbook();
  private ws?: Worksheet;

  static async from(path: string): Promise<ExcelExporter> {
    const exporter = new ExcelExporter();
    await exporter.workbook.xlsx.readFile(path);
    return exporter;
  }

  worksheet(name: string): this {
    this.ws = this.workbook.getWorksheet(name);
    if (!this.ws) throw new Error(`Worksheet “${name}” not found`);
    return this;
  }

  write(
    col: string,
    row: number,
    value: CellValue | null | undefined,
    fallback: CellValue = '',
  ): this {
    if (!this.ws) throw new Error('No worksheet loaded');
    this.ws.getCell(`${col}${row.toString()}`).value = value ?? fallback;
    return this;
  }

  toStream(): Readable {
    const stream = new PassThrough();

    this.workbook.xlsx
      .write(stream)
      .then(() => stream.end())
      .catch((err: unknown) => stream.emit('error', err));

    return stream;
  }

  ensureRows(startRow: number, templateRows: number, needed: number): this {
    if (!this.ws) throw new Error('No worksheet loaded');
    for (let i = templateRows; i < needed; i++) {
      this.ws.duplicateRow(startRow, 1, true);
    }
    return this;
  }

  async pipe(out: Writable): Promise<void> {
    await this.workbook.xlsx.write(out);
  }
}
