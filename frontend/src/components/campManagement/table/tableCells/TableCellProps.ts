import { QTableBodyCellProps } from 'src/types/quasar/QTableBodyCellProps';
import { Camp } from '@camp-registration/common/entities';

export interface TableCellProps {
  props: QTableBodyCellProps;
  camp: Camp;
  options?: object;
  printing: boolean;
}
