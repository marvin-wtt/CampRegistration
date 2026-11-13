/** A record a `:own` grant can reach. */
export interface Ownable {
  /** Whether the requesting user owns it, by the model's `ownedBy` fields. */
  owned: boolean;
}
