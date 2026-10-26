import { inject, injectable } from 'inversify';
import { QueueManager } from '#core/queue/QueueManager';
import type { Queue } from '#core/queue/Queue';
import { PaymentReconciliationService } from './payment-reconciliation.service.js';
import { PaymentNotifier } from './payment.notifier.js';

interface PaymentReconciliationJob {
  source: string;
  providerPaymentId: string;
}

/**
 * Webhooks only enqueue: the provider gets its 2xx at once, and the re-fetch
 * plus ledger update run here with the queue's retries when the provider
 * API is briefly unavailable.
 */
@injectable()
export class PaymentReconciliationQueue {
  private readonly queue: Queue<PaymentReconciliationJob>;

  constructor(
    @inject(QueueManager) queueManager: QueueManager,
    @inject(PaymentReconciliationService)
    private readonly reconciliation: PaymentReconciliationService,
    @inject(PaymentNotifier) private readonly notifier: PaymentNotifier,
  ) {
    this.queue = queueManager.create<PaymentReconciliationJob>('payment', {
      maxAttempts: 5,
      retryDelay: 1000 * 30,
      retryDelayType: 'exponential',
    });
  }

  startWorker(): void {
    this.queue.process(async ({ payload }) => {
      const outcome = await this.reconciliation.reconcileProviderPayment(
        payload.source,
        payload.providerPaymentId,
      );

      await this.notifier.notify(outcome);
    });
  }

  async enqueue(source: string, providerPaymentId: string): Promise<void> {
    await this.queue.add('reconcile', { source, providerPaymentId });
  }
}
