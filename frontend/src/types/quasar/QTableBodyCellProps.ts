import type { NamedColor, QTableColumn } from 'quasar';

/**
 * @see https://quasar.dev/vue-components/table#qtable-api
 */
export interface QTableBodyCellProps<V = unknown, R = object> {
  value: V;
  key: unknown;
  row: R;
  rowIndex: number;
  pageIndex: number;
  col: QTableColumn;
  cols: QTableColumn[];
  colsMap: object;
  sort: (col: string | object) => void;
  color: NamedColor;
  dark?: boolean | null;
  dense: boolean;
  expand: boolean;
  selected: boolean;
}
