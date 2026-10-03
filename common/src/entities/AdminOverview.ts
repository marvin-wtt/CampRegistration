export interface AdminOverview {
  users: {
    total: number;
    unverified: number;
    locked: number;
  };
  organizations: {
    total: number;
    pending: number;
    verified: number;
    rejected: number;
  };
  events: {
    total: number;
    open: number;
    upcoming: number;
    closed: number;
  };
  registrations: {
    total: number;
  };
  queues: {
    failedJobs: number;
  };
  legal: {
    total: number;
    configured: number;
  };
  files: {
    total: number;
  };
  billing: {
    /** Events currently running, billed once they end. */
    draft: number;
    /** Finalized, awaiting payment. */
    open: number;
    /** What the open bills add up to, per currency (decimal strings). */
    outstanding: { currency: string; amount: string }[];
  };
}
