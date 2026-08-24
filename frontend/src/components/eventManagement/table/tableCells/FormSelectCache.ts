import type { TableCellProps } from '@/components/eventManagement/table/tableCells/TableCellProps';
import { getSelectOptions } from '@/utils/surveyJS';

type Entry = Record<string, string | Record<string, string>>;

export class FormSelectCache {
  private static eventId: string | undefined;
  private static form: object | undefined;
  private static cache = new Map<string, Entry | undefined>();

  public static get(event: TableCellProps['event'], field: string) {
    // Invalidate when switching events or when the event's form is updated.
    // On update the store reassigns the event, so `form` is a new reference.
    if (this.eventId !== event?.id || this.form !== event?.form) {
      this.clear();
      this.eventId = event?.id;
      this.form = event?.form;
    }

    if (!this.cache.has(field)) {
      this.cache.set(field, getSelectOptions(event.form, field));
    }

    return this.cache.get(field);
  }

  public static clear() {
    this.eventId = undefined;
    this.form = undefined;
    this.cache = new Map();
  }
}
