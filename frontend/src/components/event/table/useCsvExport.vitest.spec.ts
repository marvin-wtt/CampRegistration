import { describe, expect, it, vi } from 'vitest';
import type * as QuasarModule from 'quasar';

const exportFileMock = vi.hoisted(() => vi.fn());

vi.mock('quasar', async (importOriginal) => {
  const actual = await importOriginal<typeof QuasarModule>();
  return {
    ...actual,
    exportFile: exportFileMock,
  };
});

import { useCsvExport } from '@/components/event/table/useCsvExport';
import { TableCellRenderer } from '@/components/event/table/TableCellRenderer';
import type { ComponentRegistryEntry } from '@/components/event/table/ComponentRegistry';
import type { CTableColumnTemplate } from '@/types/CTableTemplate';
import type {
  EventDetails,
  Registration,
} from '@camp-registration/common/entities';
import type { Component } from 'vue';
import type { TableCellProps } from '@/components/event/table/tableCells/TableCellProps';

const dummyComponent = {} as Component<TableCellProps>;

function makeEntry(
  toCsv?: ComponentRegistryEntry['options']['toCsv'],
): ComponentRegistryEntry {
  return {
    component: dummyComponent,
    options: toCsv ? { toCsv } : {},
  };
}

describe('useCsvExport', () => {
  it('exports array values element-by-element and hides conditionally-visible cells', async () => {
    // isArray column: each element goes through the renderer's toCsv
    // individually, not the whole array at once (mirrors TableCellWrapper's
    // on-screen per-element rendering).
    const tagsColumn: CTableColumnTemplate = {
      name: 'tags',
      label: 'Tags',
      field: (row) => (row as Registration & { tags: string[] }).tags,
      fieldName: 'tags',
      isArray: true,
    };

    // showIf-gated column: only visible for accepted registrations, mirroring
    // TableCellWrapper's `v-if="renderer.isVisible(...)"`.
    const noteColumn: CTableColumnTemplate = {
      name: 'note',
      label: 'Note',
      field: (row) => (row as Registration & { note: string }).note,
      fieldName: 'note',
      showIf: "{status} = 'ACCEPTED'",
    };

    const renderers = new Map<string, TableCellRenderer>();
    renderers.set(
      'tags',
      new TableCellRenderer(
        makeEntry((value) => String(value).toUpperCase()),
        tagsColumn,
      ),
    );
    renderers.set('note', new TableCellRenderer(makeEntry(), noteColumn));

    const rows = [
      { status: 'ACCEPTED', tags: ['a', 'b'], note: 'hello' },
      { status: 'PENDING', tags: ['c'], note: 'secret' },
    ] as unknown as Registration[];

    const { exportRegistrationsToCsv } = useCsvExport();

    exportRegistrationsToCsv({
      event: { name: 'Summer Camp' } as EventDetails,
      templateTitle: 'All',
      columns: [tagsColumn, noteColumn],
      renderers,
      rows,
    });

    expect(exportFileMock).toHaveBeenCalledTimes(1);
    const [filename, blob] = exportFileMock.mock.calls[0] as [string, Blob];

    expect(filename).toMatch(/^Summer_Camp_All_\d{4}-\d{2}-\d{2}\.csv$/);

    const text = await blob.text();
    // Leading BOM so Excel auto-detects UTF-8.
    expect(text).toBe(
      '﻿' +
        'Tags,Note\r\n' +
        'A; B,hello\r\n' + // accepted: array formatted per-element; note visible
        'C,', // pending: note hidden by showIf -> empty field
    );
  });
});
