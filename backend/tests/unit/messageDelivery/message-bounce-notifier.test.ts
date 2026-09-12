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
  it('ignores a "delayed" DSN report instead of marking the delivery bounced', async () => {
    await processBounceResults([
      { correlationId: 'abc@example.com', action: 'delayed' },
    ]);

    expect(markBouncedByCorrelationId).not.toHaveBeenCalled();
  });

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

  it('does not let an earlier "delayed" report suppress a later "failed" report for the same delivery', async () => {
    markBouncedByCorrelationId.mockResolvedValueOnce(null);

    await processBounceResults([
      { correlationId: 'abc@example.com', action: 'delayed' },
      { correlationId: 'abc@example.com', action: 'failed' },
    ]);

    expect(markBouncedByCorrelationId).toHaveBeenCalledTimes(1);
    expect(markBouncedByCorrelationId).toHaveBeenCalledWith(
      'abc@example.com',
      expect.any(String),
    );
  });
});
