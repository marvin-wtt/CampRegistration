import type { CampDetails } from '@camp-registration/common/entities';

/**
 * Props passed to a cell renderer's `customOptionsComponent` (registered via
 * `TableComponentRegistry`). The render options themselves are bound through
 * `v-model` (use `defineModel`); this interface carries the surrounding context
 * an editor may need — e.g. to resolve the form field's select choices.
 *
 * Mirrors {@link TableCellProps} so options editors share a stable, future-proof
 * contract with the dialog that mounts them.
 */
export interface TableCellOptionsProps {
  /** The camp the column belongs to (provides the form and locales). */
  camp: CampDetails;
  /** The (unprefixed) form field the column is bound to. */
  field: string;
}
