import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import type * as QuasarModule from 'quasar';

const exportFileMock = vi.hoisted(() => vi.fn());

// This file overrides the project-wide vue-i18n mock (set in
// test/vitest/setup-file.ts) to a German locale specifically to verify
// useCsvExport.ts picks a `;` separator for it — see csv.vitest.spec.ts for
// the underlying csvSeparatorForLocale mapping itself.
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    te: () => false,
    d: (key: string) => key,
    locale: ref('de'),
  }),
}));

vi.mock('quasar', async (importOriginal) => {
  const actual = await importOriginal<typeof QuasarModule>();
  return {
    ...actual,
    exportFile: exportFileMock,
  };
});

import { useCsvExport } from '@/components/event/table/useCsvExport';
import type { CTableColumnTemplate } from '@/types/CTableTemplate';
import type {
  EventDetails,
  Registration,
} from '@camp-registration/common/entities';

describe('useCsvExport with a German locale', () => {
  it('separates fields with a semicolon instead of a comma', async () => {
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

    const rows = [{ name: 'Alice', age: 30 }] as unknown as Registration[];

    const { exportRegistrationsToCsv } = useCsvExport();

    exportRegistrationsToCsv({
      event: { name: 'Sommercamp' } as EventDetails,
      templateTitle: 'Alle',
      columns: [nameColumn, ageColumn],
      renderers: new Map(),
      rows,
    });

    const [, blob] = exportFileMock.mock.calls[0] as [string, Blob];
    const text = await blob.text();

    expect(text).toBe('﻿' + 'Name;Age\r\n' + 'Alice;30');
  });
});
