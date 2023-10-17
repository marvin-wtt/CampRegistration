import { QTableBodyCellProps } from 'src/types/quasar/QTableBodyCellProps';
import { RegistrationSettings } from 'src/types/RegistrationSettings';

export interface TableCellProps {
  props: QTableBodyCellProps;
  settings?: RegistrationSettings;
  options?: object;
  printing: boolean;
}
