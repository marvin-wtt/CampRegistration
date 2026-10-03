import { describe, expect, it } from 'vitest';
import { toCsv } from '#utils/csv';

describe('toCsv', () => {
  it('starts with a byte order mark and ends lines with CRLF', () => {
    expect(toCsv(['a', 'b'], [['1', 2]])).toBe('﻿a,b\r\n1,2\r\n');
  });

  it('quotes fields with separators, quotes, or line breaks', () => {
    expect(toCsv(['x'], [['a,b'], ['say "hi"'], ['two\nlines']])).toBe(
      '﻿x\r\n"a,b"\r\n"say ""hi"""\r\n"two\nlines"\r\n',
    );
  });

  it('leaves null and undefined empty', () => {
    expect(toCsv(['a', 'b'], [[null, undefined]])).toBe('﻿a,b\r\n,\r\n');
  });

  it('defuses text a spreadsheet would run as a formula', () => {
    expect(toCsv(['x'], [['=SUM(A1)'], ['+1'], ['@cmd'], [-5]])).toBe(
      "﻿x\r\n'=SUM(A1)\r\n'+1\r\n'@cmd\r\n-5\r\n",
    );
  });
});
