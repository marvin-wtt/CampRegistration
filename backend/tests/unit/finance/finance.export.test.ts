import { describe, expect, it } from 'vitest';
import { receiptFileNames } from '#app/finance/finance.export';
import { toCsv } from '#utils/spreadsheet';

describe('receiptFileNames', () => {
  it('names files by receipt number, further pages with a suffix', () => {
    const names = receiptFileNames([
      {
        receiptNumber: 17,
        files: [{ originalName: 'IMG_1.JPG' }, { originalName: 'IMG_2.jpg' }],
      },
      { receiptNumber: 3, files: [{ originalName: 'invoice.pdf' }] },
      { receiptNumber: 4, files: [] },
    ]).map((entry) => entry.name);

    expect(names).toEqual(['017.jpg', '017-2.jpg', '003.pdf']);
  });

  it('pads to the widest number so files sort in order', () => {
    const names = receiptFileNames([
      { receiptNumber: 1200, files: [{ originalName: 'a.png' }] },
      { receiptNumber: 7, files: [{ originalName: 'noextension' }] },
    ]).map((entry) => entry.name);

    expect(names).toEqual(['1200.png', '0007']);
  });
});

describe('toCsv', () => {
  it('quotes what needs quoting and starts with a byte-order mark', () => {
    const csv = toCsv({
      name: 'Expenses',
      columns: [{ header: 'Description' }, { header: 'Amount' }],
      rows: [
        ['Pizza, drinks', 47.8],
        ['Said "thanks"', null],
      ],
    });

    expect(csv).toBe(
      '﻿Description,Amount\r\n"Pizza, drinks",47.8\r\n"Said ""thanks""",\r\n',
    );
  });

  it('writes dates as YYYY-MM-DD', () => {
    const csv = toCsv({
      name: 'x',
      columns: [{ header: 'Date' }],
      rows: [[new Date('2026-07-27T00:00:00Z')]],
    });

    expect(csv.split('\r\n')[1]).toBe('2026-07-27');
  });
});
