import type { Identifiable } from './Identifiable.js';
import type { Chore } from './Chore.js';

export type ChoreRotationUnit = 'PARTICIPANT' | 'ROOM';

export interface ChoreAssignment extends Identifiable {
  choreId: string;
  chore: Pick<Chore, 'id' | 'name'>;
  rotationUnit: ChoreRotationUnit;
  date: string;
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
  id: string;
  assignmentCount: number;
  lastAssignedAt: string | null;
}

export interface ChoreAssignmentSuggestions {
  unit: ChoreRotationUnit;
  candidates: ChoreAssignmentSuggestionCandidate[];
}
