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

export abstract class Queue<T extends object> {
  protected readonly options: QueueOptions = {
    maxAttempts: 5,
    retryDelay: 5000,
    retryDelayType: 'exponential',
  };

  private handler: ((payload: T) => Promise<void>) | null = null;

  protected constructor(
    protected queue: string,
    options?: Partial<QueueOptions>,
  ) {
    this.options = {
      ...this.options,
      ...options,
    };
  }

  protected async run() {
    if (!this.handler) {
      return;
    }

    const job = await this.poll();

    if (job === null) {
      return;
    }

    try {
      await this.handler(job.payload);

      await this.complete(job.id);
    } catch (error) {
      await this.release(job.id, error);
    }
  }

  public process(handler: (payload: T) => Promise<void>) {
    this.handler = handler;
  }

  public abstract all(): Promise<Job<T>[]>;

  public abstract add(payload: T, options?: EnnQueueOptions): Promise<void>;

  protected abstract poll(): Promise<{ id: string; payload: T } | null>;

  protected abstract complete(id: string): Promise<void>;

  protected abstract release(id: string, error: unknown): Promise<void>;
}
