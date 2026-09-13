import { beforeEach, describe, expect, it, vi } from 'vitest';
import { processBounceResults } from '#app/messageDelivery/message-bounce-notifier';
import { MessageDeliveryService } from '#app/messageDelivery/message-delivery.service';
import { RegistrationService } from '#app/registration/registration.service';
import { EventService } from '#app/event/event.service';
import { RealtimeService } from '#core/realtime/RealtimeService';
import { resolve } from '#core/ioc/container';

vi.mock('#core/ioc/container', () => ({
  resolve: vi.fn(),
}));

const markBouncedByCorrelationId = vi.fn();
const getRegistrationWithEventById = vi.fn();
const getEventById = vi.fn();
const emit = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();

  vi.mocked(resolve).mockImplementation((id: unknown) => {
    if (id === MessageDeliveryService) {
      return {
        markBouncedByCorrelationId,
      } as unknown as MessageDeliveryService;
    }
    if (id === RegistrationService) {
      return { getRegistrationWithEventById } as unknown as RegistrationService;
    }
    if (id === EventService) {
      return { getEventById } as unknown as EventService;
    }
    if (id === RealtimeService) {
      return { emit } as unknown as RealtimeService;
    }
    throw new Error(`Unexpected resolve() call for ${String(id)}`);
  });
});

describe('processBounceResults', () => {
  it('marks the delivery bounced for a "failed" DSN report', async () => {
    markBouncedByCorrelationId.mockResolvedValueOnce(null);

    await processBounceResults([
      { correlationId: 'abc@example.com', action: 'failed' },
    ]);

    expect(markBouncedByCorrelationId).toHaveBeenCalledWith(
      'abc@example.com',
      expect.any(String),
    );
  });

  it('processes every result in the batch', async () => {
    markBouncedByCorrelationId.mockResolvedValue(null);

    await processBounceResults([
      { correlationId: 'abc@example.com', action: 'failed' },
      { correlationId: 'def@example.com', action: 'failed' },
    ]);

    expect(markBouncedByCorrelationId).toHaveBeenCalledTimes(2);
  });
});
