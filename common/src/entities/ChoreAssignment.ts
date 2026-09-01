import type { Identifiable } from './Identifiable.js';
import type { Chore } from './Chore.js';

/** Chosen per occurrence — the same chore can be covered by individuals one
 * day and by a whole room the next. See `ChoreAssignmentSuggestions`. */
export type ChoreRotationUnit = 'PARTICIPANT' | 'ROOM';

/**
 * One occurrence of a chore — e.g. "Kitchen, Monday, Lunch". Never carries a
 * manually-typed name; a display name is always derived from
 * `chore.name` + `date` + `slot`.
 */
export interface ChoreAssignment extends Identifiable {
  choreId: string;
  chore: Pick<Chore, 'id' | 'name'>;
  rotationUnit: ChoreRotationUnit;
  /** YYYY-MM-DD */
  date: string;
  /** Free-text label, e.g. "Breakfast"/"Lunch"/"Setup"; null = unlabeled/all-day. */
  slot: string | null;
  registrationIds: string[];
}

export type ChoreAssignmentCreateData = Pick<
  ChoreAssignment,
  'choreId' | 'date' | 'rotationUnit'
> &
  Partial<Pick<ChoreAssignment, 'slot' | 'registrationIds'>>;

export type ChoreAssignmentUpdateData = Partial<
  Pick<
    ChoreAssignment,
    'choreId' | 'date' | 'slot' | 'registrationIds' | 'rotationUnit'
  >
>;

export interface ChoreAssignmentSuggestionCandidate {
  /** A registration id (unit `PARTICIPANT`) or a room id (unit `ROOM`). */
  id: string;
  assignmentCount: number;
  /** YYYY-MM-DD of the most recent occurrence this candidate was in, or null if never. */
  lastAssignedAt: string | null;
}

export interface ChoreAssignmentSuggestions {
  unit: ChoreRotationUnit;
  candidates: ChoreAssignmentSuggestionCandidate[];
}
