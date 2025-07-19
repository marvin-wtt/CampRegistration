import Excel from 'exceljs';
import type Stream from 'node:stream';

export async function useExcel(buffer: ArrayBuffer) {
  const workbook = new Excel.Workbook();
  await workbook.xlsx.load(buffer);

  let ws: Excel.Worksheet | undefined = undefined;
  function loadWorksheet(name: string) {
    ws = workbook.getWorksheet(name);

    if (!ws) {
      throw new Error('Invalid workbook loaded!');
    }
  }

  const writeWithDefault = (
    col: string,
    row: number,
    value: string | number | null,
    fallback: string | number = '',
  ) => {
    if (!ws) {
      throw new Error('No worksheet loaded');
    }

    ws.getCell(`${col}${row.toString()}`).value = value ?? fallback;
  };

  const duplicateRows = (
    startRow: number,
    rowCount: number,
    itemCount: number,
  ) => {
    if (!ws) {
      throw new Error('No worksheet loaded');
    }

    if (rowCount >= itemCount) {
      return;
    }

    // It is not possible to duplicate multiple rows at the same time
    const count = itemCount - rowCount;
    for (let i = 0; i < count; i++) {
      ws.duplicateRow(startRow, 1, true);
    }
  };

  async function save(stream: Stream): Promise<void> {
    await workbook.xlsx.write(stream);
  }

  return {
    loadWorksheet,
    writeWithDefault,
    duplicateRows,
    save,
  };
}
