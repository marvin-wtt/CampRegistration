import type { Identifiable } from './Identifiable.js';
import type { Duty } from './Duty.js';

/** Chosen per occurrence — the same duty can be covered by individuals one
 * day and by a whole room the next. See `DutyAssignmentSuggestions`. */
export type DutyRotationUnit = 'PARTICIPANT' | 'ROOM';

/**
 * One occurrence of a duty — e.g. "Kitchen, Monday, Lunch". Never carries a
 * manually-typed name; a display name is always derived from
 * `duty.name` + `date` + `slot`.
 */
export interface DutyAssignment extends Identifiable {
  dutyId: string;
  duty: Pick<Duty, 'id' | 'name'>;
  rotationUnit: DutyRotationUnit;
  /** YYYY-MM-DD */
  date: string;
  /** Free-text label, e.g. "Breakfast"/"Lunch"/"Setup"; null = unlabeled/all-day. */
  slot: string | null;
  registrationIds: string[];
}

export type DutyAssignmentCreateData = Pick<
  DutyAssignment,
  'dutyId' | 'date' | 'rotationUnit'
> &
  Partial<Pick<DutyAssignment, 'slot' | 'registrationIds'>>;

export type DutyAssignmentUpdateData = Partial<
  Pick<
    DutyAssignment,
    'dutyId' | 'date' | 'slot' | 'registrationIds' | 'rotationUnit'
  >
>;

export interface DutyAssignmentSuggestionCandidate {
  /** A registration id (unit `PARTICIPANT`) or a room id (unit `ROOM`). */
  id: string;
  assignmentCount: number;
  /** YYYY-MM-DD of the most recent occurrence this candidate was in, or null if never. */
  lastAssignedAt: string | null;
}

export interface DutyAssignmentSuggestions {
  unit: DutyRotationUnit;
  candidates: DutyAssignmentSuggestionCandidate[];
}
