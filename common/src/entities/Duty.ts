import type { Identifiable } from './Identifiable.js';
import type { Translatable } from './Translatable.js';

/**
 * What a duty rotates by when suggesting who's next — an individual
 * participant, or everyone currently sharing a room. See
 * `DutyAssignmentSuggestions`.
 */
export type DutyRotationUnit = 'PARTICIPANT' | 'ROOM';

export interface Duty extends Identifiable {
  name: Translatable;
  sortOrder: number;
  rotationUnit: DutyRotationUnit;
  /**
   * Suggested party size for PARTICIPANT-rotation duties — not enforced, just
   * seeds the next assignment's suggestion. Meaningless for ROOM rotation.
   */
  defaultCount: number | null;
}

export type DutyCreateData = Pick<Duty, 'name'> &
  Partial<Pick<Duty, 'rotationUnit' | 'defaultCount'>>;

export type DutyUpdateData = Partial<
  Pick<Duty, 'name' | 'sortOrder' | 'rotationUnit' | 'defaultCount'>
>;
