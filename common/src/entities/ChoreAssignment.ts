import type { Identifiable } from './Identifiable.js';
import type { Chore, ChoreRotationUnit } from './Chore.js';

export type ChoreAssignmentStatus = 'PLANNED' | 'DONE' | 'CANCELLED';

export type ChoreMemberRole = 'MEMBER' | 'SUPERVISOR';

export interface ChoreAssignmentMember {
  registrationId: string;
  role: ChoreMemberRole;
  missed: boolean;
}

export interface ChoreAssignment extends Identifiable {
  choreId: string;
  chore: Pick<Chore, 'id' | 'name'>;
  slotId: string | null;
  batchId: string | null;
  rotationUnit: ChoreRotationUnit;
  date: string;
  status: ChoreAssignmentStatus;
  note: string | null;
  members: ChoreAssignmentMember[];
}

export type ChoreAssignmentMemberData = Pick<
  ChoreAssignmentMember,
  'registrationId'
> &
  Partial<Pick<ChoreAssignmentMember, 'role' | 'missed'>>;

export type ChoreAssignmentCreateData = Pick<
  ChoreAssignment,
  'choreId' | 'date' | 'rotationUnit'
> &
  Partial<Pick<ChoreAssignment, 'slotId' | 'note'>> & {
    members?: ChoreAssignmentMemberData[];
    // Fill the remaining members and supervisors with the fairest candidates.
    autoFill?: boolean;
  };

export type ChoreAssignmentUpdateData = Partial<
  Pick<
    ChoreAssignment,
    'choreId' | 'date' | 'slotId' | 'rotationUnit' | 'status' | 'note'
  > & { members: ChoreAssignmentMemberData[] }
>;

// Who auto-fill would add, without saving anything.
export interface ChoreAutoFillData {
  choreId: string;
  slotId?: string | null;
  date: string;
  rotationUnit: ChoreRotationUnit;
  // Override the slot's or chore's counts for this one occurrence.
  headcount?: number;
  supervisorCount?: number;
  members: ChoreAssignmentMemberData[];
  // The assignment being edited, whose stored members are being replaced.
  assignmentId?: string;
}

export type ChoreSeriesConflictMode = 'SKIP' | 'FILL' | 'REPLACE';

export interface ChoreSeriesPlanData {
  choreId: string;
  // Empty for a chore without slots.
  slotIds: string[];
  from: string;
  to: string;
  rotationUnit: ChoreRotationUnit;
  onConflict: ChoreSeriesConflictMode;
  // False creates the duties without people, to be filled later. Default true.
  assign?: boolean;
  // Only work on duties that exist already — nothing is created, so duties
  // deleted from a plan stay deleted. FILL keeps each duty's own rotation unit.
  existingOnly?: boolean;
}

export interface ChoreSeriesPlanResult {
  batchId: string | null;
  created: number;
  filled: number;
  // Planned duties whose people were replaced; the duties themselves stay.
  replaced: number;
  skipped: number;
}

export interface ChoreAssignmentBulkDeleteQuery {
  batchId?: string;
  choreId?: string | string[];
  slotId?: string;
  from?: string;
  to?: string;
}

export interface ChoreMemberRemovalQuery {
  from: string;
  to?: string;
  // Refill each spot with the next-fairest candidate.
  replace: boolean;
}

export interface ChoreMemberRemovalResult {
  removed: number;
  replaced: number;
}

export type ChoreBalance = 'BELOW' | 'AVERAGE' | 'ABOVE';

export interface ChoreAssignmentSuggestionQuery {
  choreId: string;
  unit: ChoreRotationUnit;
  role?: ChoreMemberRole;
  date?: string;
  slotId?: string;
  // An assignment being edited: its own members don't count against them.
  assignmentId?: string;
}

export interface ChoreAssignmentSuggestionCandidate {
  // A registration id, or a room id for ROOM suggestions.
  id: string;
  // Times on this chore.
  assignmentCount: number;
  // Duties across all chores.
  dutyCount: number;
  lastAssignedAt: string | null;
  balance: ChoreBalance;
  // Already on a duty that day.
  busy: boolean;
}

export interface ChoreAssignmentSuggestions {
  unit: ChoreRotationUnit;
  role: ChoreMemberRole;
  candidates: ChoreAssignmentSuggestionCandidate[];
}

export interface ChoreFairnessEntry {
  registrationId: string;
  dutyCount: number;
  heavyCount: number;
  supervisionCount: number;
  missedCount: number;
  // Effort points, for drawing bars relative to each other — not for display.
  load: number;
  // The part of load and dutyCount already behind us; the rest is upcoming.
  doneLoad: number;
  doneDutyCount: number;
  // Load relative to the average of the same group (participants or staff).
  share: number;
  balance: ChoreBalance;
}

// One upcoming duty changing hands to even out the load: one person each on a
// person duty, whole rooms — possibly of different sizes — on a room duty.
export interface ChoreRebalanceChange {
  assignmentId: string;
  role: ChoreMemberRole;
  fromRegistrationIds: string[];
  toRegistrationIds: string[];
}

export interface ChoreRebalanceData {
  changes: ChoreRebalanceChange[];
}
