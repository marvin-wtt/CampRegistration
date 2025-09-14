import type { QTableBodyCellProps } from 'src/types/quasar/QTableBodyCellProps';
import type { Camp, Registration } from '@camp-registration/common/entities';

export interface TableCellProps {
  props: QTableBodyCellProps<unknown, Registration>;
  camp: Camp;
  options?: object | undefined;
  printing: boolean;
  readonly?: boolean | undefined;
}
