import { describe, expect, it, vi } from 'vitest';
import { ProgramItemService } from '#app/programItem/program-item.service';

const prismaMock = {
  programItem: {
    findMany: vi.fn(),
  },
};

const service = new ProgramItemService(prismaMock as never);

describe('ProgramItemService.queryProgramItemsInRange', () => {
  it('filters by the inclusive date window with no plan condition when plan is "both"', async () => {
    prismaMock.programItem.findMany.mockResolvedValue([]);

    await service.queryProgramItemsInRange('event-1', {
      from: '2026-07-01',
      to: '2026-07-03',
      plan: 'both',
    });

    expect(prismaMock.programItem.findMany).toHaveBeenCalledWith({
      where: {
        eventId: 'event-1',
        date: { gte: '2026-07-01', lte: '2026-07-03' },
      },
    });
  });

  it('includes items on the requested plan or "both" when a specific plan is requested', async () => {
    prismaMock.programItem.findMany.mockResolvedValue([]);

    await service.queryProgramItemsInRange('event-1', {
      from: '2026-07-01',
      to: '2026-07-01',
      plan: 'a',
    });

    expect(prismaMock.programItem.findMany).toHaveBeenCalledWith({
      where: {
        eventId: 'event-1',
        date: { gte: '2026-07-01', lte: '2026-07-01' },
        OR: [{ plan: 'a' }, { plan: 'both' }],
      },
    });
  });
});
