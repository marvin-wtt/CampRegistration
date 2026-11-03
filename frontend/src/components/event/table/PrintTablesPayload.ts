import type {
  EventDetails,
  Registration,
  TableColumnTemplate,
  TableTemplate,
} from '@camp-registration/common/entities';

export interface PrintTablesPayload {
  timestamp?: string;
  locale?: string;

  questions: TableColumnTemplate[];
  registrations: Registration[];
  event: EventDetails;

  templates: TableTemplate[];
  // Empty prints every group.
  groups?: string[];
}

export interface PrintTablesSelection {
  templateIds: string[];
  groups: string[];
}
