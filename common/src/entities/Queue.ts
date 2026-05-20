export interface QueueCounts {
  active: number;
  failed: number;
  pending: number;
  delayed: number;
}

export interface QueueInfo {
  name: string;
  counts: QueueCounts;
}
