export interface AdminOverview {
  users: {
    total: number;
    unverified: number;
    locked: number;
  };
  camps: {
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
}
