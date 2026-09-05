import { describe, expect, it } from 'vitest';
import {
  sortRows,
  type Pagination,
} from '@/components/event/table/useResultTableModel';
import type { CTableColumnTemplate } from '@/types/CTableTemplate';
import type { Registration } from '@camp-registration/common/entities';

function makePagination(overrides: Partial<Pagination> = {}): Pagination {
  return {
    sortBy: null,
    descending: false,
    rowsPerPage: 0,
    ...overrides,
  };
}

const nameColumn: CTableColumnTemplate = {
  name: 'name',
  label: 'Name',
  field: (row) => (row as Registration & { name: string }).name,
  fieldName: 'name',
};

const ageColumn: CTableColumnTemplate = {
  name: 'age',
  label: 'Age',
  field: (row) => (row as Registration & { age: number }).age,
  fieldName: 'age',
};

const rows = [
  { name: 'Charlie', age: 30 },
  { name: 'alice', age: 10 },
  { name: 'Bob', age: 20 },
] as unknown as Registration[];

describe('sortRows', () => {
  it('returns the rows unchanged when no column is sorted', () => {
    expect(sortRows(rows, [nameColumn], makePagination())).toEqual(rows);
  });

  it('returns the rows unchanged when sortBy references an unknown column', () => {
    expect(
      sortRows(rows, [nameColumn], makePagination({ sortBy: 'missing' })),
    ).toEqual(rows);
  });

  it('sorts ascending by a string column, case-insensitively', () => {
    const sorted = sortRows(
      rows,
      [nameColumn],
      makePagination({ sortBy: 'name' }),
    );

    expect(sorted.map((r) => (r as unknown as { name: string }).name)).toEqual([
      'alice',
      'Bob',
      'Charlie',
    ]);
  });

  it('sorts descending when pagination.descending is set', () => {
    const sorted = sortRows(
      rows,
      [nameColumn],
      makePagination({ sortBy: 'name', descending: true }),
    );

    expect(sorted.map((r) => (r as unknown as { name: string }).name)).toEqual([
      'Charlie',
      'Bob',
      'alice',
    ]);
  });

  it('sorts numerically for a numeric column instead of lexicographically', () => {
    const sorted = sortRows(
      rows,
      [ageColumn],
      makePagination({ sortBy: 'age' }),
    );

    expect(sorted.map((r) => (r as unknown as { age: number }).age)).toEqual([
      10, 20, 30,
    ]);
  });

  it('sorts null/undefined values first, ascending', () => {
    const withNull = [
      { name: 'Bob' },
      { name: null },
      { name: 'alice' },
    ] as unknown as Registration[];

    const sorted = sortRows(
      withNull,
      [nameColumn],
      makePagination({ sortBy: 'name' }),
    );

    expect(
      sorted.map((r) => (r as unknown as { name: string | null }).name),
    ).toEqual([null, 'alice', 'Bob']);
  });

  it('does not mutate the input array', () => {
    const copy = [...rows];
    sortRows(rows, [nameColumn], makePagination({ sortBy: 'name' }));

    expect(rows).toEqual(copy);
  });
});
