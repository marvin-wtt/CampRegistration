import type {
  CampDetails,
  Registration,
  TableColumnTemplate,
  TableTemplate,
} from '@camp-registration/common/entities';

export interface PrintTablesPayload {
  timestamp?: string;
  locale?: string;

  questions: TableColumnTemplate[];
  registrations: Registration[];
  camp: CampDetails;

  templates: TableTemplate[];
}
