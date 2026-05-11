import type { Timestamp } from '@quasar/quasar-ui-qcalendar';

export interface DragAndDropScope {
  timestamp: Timestamp;
  droppable: boolean;
}
