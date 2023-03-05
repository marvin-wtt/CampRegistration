import { QTableColumn } from 'src/types/quasar/QTableColum';
import { SimpleTranslation } from 'src/composables/objectTranslation';

export interface TableColumnTemplate extends Omit<QTableColumn, 'label'> {
  renderAs?: string;
  renderOptions?: object;
  headerVertical?: boolean;
  shrink?: boolean;
  hideIf?: string;
  showIf?: string;
  label: string | SimpleTranslation;
}
