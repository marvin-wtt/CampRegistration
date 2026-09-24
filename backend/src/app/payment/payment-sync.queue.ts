import { inject, injectable } from 'inversify';
import { QueueManager } from '#core/queue/QueueManager';
import type { Queue } from '#core/queue/Queue';
import { PaymentService } from './payment.service.js';
import { PaymentNotifier } from './payment.notifier.js';

interface PaymentSyncJob {
  source: string;
  providerPaymentId: string;
}

/**
 * Webhooks only enqueue: the provider gets its 2xx at once, and the re-fetch
 * plus ledger update run here with the queue's retries when the provider
 * API is briefly unavailable.
 */
@injectable()
export class PaymentSyncQueue {
  private readonly queue: Queue<PaymentSyncJob>;

  constructor(
    @inject(QueueManager) queueManager: QueueManager,
    @inject(PaymentService) private readonly paymentService: PaymentService,
    @inject(PaymentNotifier) private readonly notifier: PaymentNotifier,
  ) {
    this.queue = queueManager.create<PaymentSyncJob>('payment', {
      maxAttempts: 5,
      retryDelay: 1000 * 30,
      retryDelayType: 'exponential',
    });
  }

  startWorker(): void {
    this.queue.process(async ({ payload }) => {
      const outcome = await this.paymentService.syncProviderPayment(
        payload.source,
        payload.providerPaymentId,
      );

      await this.notifier.notify(outcome);
    });
  }

  async enqueue(source: string, providerPaymentId: string): Promise<void> {
    await this.queue.add('sync', { source, providerPaymentId });
  }
}
