import { QTableColumn } from 'quasar';

/**
 * @see https://quasar.dev/vue-components/table#qtable-api
 */
export interface QTableBodyCellProps {
  value: unknown;
  key: unknown;
  row: object;
  rowIndex: number;
  pageIndex: number;
  col: QTableColumn;
  cols: QTableColumn[];
  colsMap: object;
  sort: (col: string | object) => void;
  color: string;
  dark: boolean;
  dense: boolean;
  expand: boolean;
}
