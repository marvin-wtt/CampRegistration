import type { TableCellProps } from 'components/campManagement/table/tableCells/TableCellProps';
import { getSelectOptions } from 'src/utils/surveyJS';

type Entry = Record<string, string | Record<string, string>>;

export class FormSelectCache {
  private static campId: string | undefined;
  private static cache = new Map<string, Entry | undefined>();

  public static get(camp: TableCellProps['camp'], field: string) {
    if (this.campId !== camp?.id) {
      this.clear();
      this.campId = camp?.id;
    }

    if (!this.cache.has(field)) {
      this.cache.set(field, getSelectOptions(camp.form, field));
    }

    return this.cache.get(field);
  }

  private static clear() {
    this.campId = undefined;
    this.cache = new Map();
  }
}
