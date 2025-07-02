export interface QueueOptions {
  maxAttempts: number;
  retryDelay: number; // milliseconds
  retryDelayType: 'fixed' | 'exponential';
  limit?: {
    max: number;
    duration: number; // in milliseconds
  };
}

export interface EnnQueueOptions {
  delay?: number;
  priority?: number; // 1 is the highest
}

export interface Job<T extends object> {
  id: string;
  queue: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  payload: T;
  reservedAt: Date | null;
  runAt: Date | null;
  finishedAt: Date | null;
  error: unknown;
  attempts: number;
}

// TODO Add process abstract method

export abstract class AbstractQueue<T extends object> {
  protected readonly options: QueueOptions = {
    maxAttempts: 5,
    retryDelay: 5000,
    retryDelayType: 'exponential',
  };

  protected constructor(
    protected queue: string,
    options?: Partial<QueueOptions>,
  ) {
    this.options = {
      ...this.options,
      ...options,
    };
  }

  public abstract all(): Promise<Job<T>[]>;

  public abstract push(payload: T, options?: EnnQueueOptions): Promise<void>;

  public abstract poll(): Promise<{ id: string; payload: T } | null>;

  public abstract complete(id: string): Promise<void>;

  public abstract release(id: string, error: unknown): Promise<void>;
}
