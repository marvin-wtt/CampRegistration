import { describe, expect, it, vi } from 'vitest';
import { EventService } from '#app/event/event.service';

function createService(findUnique: ReturnType<typeof vi.fn>): EventService {
  const service = new EventService({} as never);
  (service as unknown as { prisma: unknown }).prisma = {
    event: { findUnique },
  };

  return service;
}

describe('EventService.isOrganizationVerified', () => {
  it('is true when the organization is verified', async () => {
    const findUnique = vi.fn().mockResolvedValue({
      organization: { verificationStatus: 'VERIFIED' },
    });
    const service = createService(findUnique);

    await expect(service.isOrganizationVerified('event-1')).resolves.toBe(true);
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: 'event-1' },
      select: { organization: { select: { verificationStatus: true } } },
    });
  });

  it('is false when the organization is pending or rejected', async () => {
    const findUnique = vi.fn().mockResolvedValue({
      organization: { verificationStatus: 'PENDING' },
    });
    const service = createService(findUnique);

    await expect(service.isOrganizationVerified('event-1')).resolves.toBe(
      false,
    );
  });

  it('is false when the event does not exist', async () => {
    const findUnique = vi.fn().mockResolvedValue(null);
    const service = createService(findUnique);

    await expect(service.isOrganizationVerified('missing')).resolves.toBe(
      false,
    );
  });
});
