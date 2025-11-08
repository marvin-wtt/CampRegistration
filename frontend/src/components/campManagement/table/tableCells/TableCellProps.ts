import type { QTableBodyCellProps } from 'src/types/quasar/QTableBodyCellProps';
import type {
  CampDetails,
  Registration,
} from '@camp-registration/common/entities';

export interface TableCellProps {
  props: QTableBodyCellProps<unknown, Registration>;
  camp: CampDetails;
  options?: object | undefined;
  printing: boolean;
  readonly?: boolean | undefined;
}
