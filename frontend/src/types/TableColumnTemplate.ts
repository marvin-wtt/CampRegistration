import { QTableColumn } from 'src/types/quasar/QTableColum';

export interface TableColumnTemplate extends Omit<QTableColumn, 'label'> {
  renderAs?: string;
  renderOptions?: object;
  headerVertical?: boolean;
  editable?: boolean;
  shrink?: boolean;
  hideIf?: string;
  showIf?: string;
  label: string | Record<string, string>;
}
