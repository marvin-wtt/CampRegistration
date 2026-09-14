export interface ErrorTracker {
  name(): string;

  captureException(error: unknown): Promise<void> | void;

  /**
   * Best-effort reachability/config check run once at boot. Omit on a
   * tracker that has no meaningful way to check (e.g. one with nothing to
   * reach over the network).
   */
  isAvailable?(): Promise<boolean> | boolean;
}
