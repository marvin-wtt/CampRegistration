import type { TableCellProps } from 'components/campManagement/table/tableCells/TableCellProps';
import { getSelectOptions } from 'src/utils/surveyJS';

type Entry = Record<string, string | Record<string, string>>;

export class FormSelectCache {
  private static campId: string | undefined;
  private static form: object | undefined;
  private static cache = new Map<string, Entry | undefined>();

  public static get(camp: TableCellProps['camp'], field: string) {
    // Invalidate when switching camps or when the camp's form is updated.
    // On update the store reassigns the camp, so `form` is a new reference.
    if (this.campId !== camp?.id || this.form !== camp?.form) {
      this.clear();
      this.campId = camp?.id;
      this.form = camp?.form;
    }

    if (!this.cache.has(field)) {
      this.cache.set(field, getSelectOptions(camp.form, field));
    }

    return this.cache.get(field);
  }

  public static clear() {
    this.campId = undefined;
    this.form = undefined;
    this.cache = new Map();
  }
}
