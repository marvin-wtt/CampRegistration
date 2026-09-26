import { useI18n } from 'vue-i18n';
import { exportFile } from 'quasar';
import type {
  EventDetails,
  Registration,
} from '@camp-registration/common/entities';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { FormSelectCache } from '@/components/event/table/tableCells/FormSelectCache';
import type { TableCellRenderer } from '@/components/event/table/TableCellRenderer';
import { objectValueByPath } from '@/utils/objectValueByPath';
import { isoToLocalDate } from '@/utils/date';
import { csvSeparatorForLocale, toCsv } from '@/utils/csv';
import {
  stringifyCsvValue,
  type CsvFormatContext,
} from '@/utils/csvValueFormatter';
import type { CTableColumnTemplate } from '@/types/CTableTemplate';

export interface ExportRegistrationsToCsvOptions {
  event: EventDetails;
  templateTitle: string | Record<string, string>;
  columns: CTableColumnTemplate[];
  renderers: Map<string, TableCellRenderer>;
  rows: Registration[];
}

export function useCsvExport() {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const { t, te, locale } = useI18n();
  const { to } = useObjectTranslation();

  function translateCountry(country: string): string {
    const key = `country.${country}`;
    return te(key) ? t(key) : country;
  }

  function buildFilename(
    event: EventDetails,
    templateTitle: string | Record<string, string>,
  ): string {
    const parts = [
      to(event.name),
      to(templateTitle),
      isoToLocalDate(new Date().toISOString()),
    ];

    const sanitized = parts
      .map((part) => part.trim().replace(/[^\w-]+/g, '_'))
      .filter((part) => part.length > 0);

    return `${sanitized.join('_')}.csv`;
  }

  // Cell renderers declare their own CSV behaviour via the `toCsv` registry
  // option (see tableCells/index.ts), and know whether their value is
  // multi-valued (isArray) — this mirrors TableCellWrapper.vue's on-screen
  // array handling instead of reimplementing it.
  function formatColumnValue(
    renderer: TableCellRenderer | undefined,
    value: unknown,
    ctx: CsvFormatContext,
  ): string {
    if (!renderer) {
      return stringifyCsvValue(value);
    }

    const format = (v: unknown) =>
      renderer.toCsv(v, ctx) ?? stringifyCsvValue(v);

    return renderer.isArray() && Array.isArray(value)
      ? value.map(format).join('; ')
      : format(value);
  }

  function exportRegistrationsToCsv(
    options: ExportRegistrationsToCsvOptions,
  ): void {
    const { event, templateTitle, columns, renderers, rows } = options;

    const ctx: CsvFormatContext = {
      translate: to,
      translateCountry,
      getFormSelectOptions: (fieldName: string) =>
        FormSelectCache.get(event, fieldName),
    };

    const headerRow = columns.map((column) => to(column.label));
    const dataRows = rows.map((row) =>
      columns.map((column) => {
        const renderer = renderers.get(column.name);

        // Mirrors TableCellWrapper.vue's `v-if="renderer.isVisible(...)"`:
        // a conditionally hidden cell renders nothing on screen, so it
        // exports as an empty field rather than its (context-dependent)
        // underlying value.
        if (renderer && !renderer.isVisible(row)) {
          return '';
        }

        const value =
          typeof column.field === 'function'
            ? column.field(row)
            : objectValueByPath(column.field, row);

        return formatColumnValue(renderer, value, ctx);
      }),
    );

    // German/French/Polish/Czech Excel installs expect `;` as the CSV
    // separator (they use `,` as the decimal separator) and otherwise import
    // the file as a single unsplit column.
    const separator = csvSeparatorForLocale(locale.value);
    const csv = toCsv(headerRow, dataRows, separator);
    // Leading BOM so Excel auto-detects UTF-8 instead of mangling accented
    // characters from the non-English locales.
    const blob = new Blob(['﻿' + csv], {
      type: 'text/csv;charset=utf-8;',
    });

    exportFile(buildFilename(event, templateTitle), blob, {
      mimeType: 'text/csv;charset=utf-8;',
    });
  }

  return {
    exportRegistrationsToCsv,
  };
}
