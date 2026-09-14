import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProgramPublicService } from '#app/programPublic/program-public.service';

const settingServiceMock = {
  getSetting: vi.fn(),
};

const programItemServiceMock = {
  queryProgramItemsInRange: vi.fn(),
};

const programPublishedDayServiceMock = {
  getPublishedDay: vi.fn(),
};

const service = new ProgramPublicService(
  settingServiceMock as never,
  programItemServiceMock as never,
  programPublishedDayServiceMock as never,
);

const event = {
  startAt: '2026-01-01T09:00:00',
  endAt: '2026-01-31T09:00:00',
  timezone: 'UTC',
};

describe('ProgramPublicService.getPublicView', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
    programPublishedDayServiceMock.getPublishedDay.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('is disabled when no setting row exists yet', async () => {
    settingServiceMock.getSetting.mockResolvedValue(null);

    const view = await service.getPublicView('event-1', event);

    expect(view).toEqual({ enabled: false });
    expect(
      programItemServiceMock.queryProgramItemsInRange,
    ).not.toHaveBeenCalled();
  });

  it('is disabled when the setting is stored but the master switch is off', async () => {
    settingServiceMock.getSetting.mockResolvedValue({
      data: { enabled: false, allowPastDates: true },
    });

    const view = await service.getPublicView('event-1', event);

    expect(view).toEqual({ enabled: false });
  });

  it('defaults to today, unpublished, when today has no published plan', async () => {
    settingServiceMock.getSetting.mockResolvedValue({
      data: { enabled: true, allowPastDates: true },
    });

    const view = await service.getPublicView('event-1', event);

    expect(view).toEqual({
      enabled: true,
      date: '2026-01-15',
      minDate: '2026-01-01',
      maxDate: '2026-01-31',
      published: false,
    });
    expect(
      programItemServiceMock.queryProgramItemsInRange,
    ).not.toHaveBeenCalled();
  });

  it('serves the published plan for the requested day', async () => {
    settingServiceMock.getSetting.mockResolvedValue({
      data: { enabled: true, allowPastDates: true },
    });
    programPublishedDayServiceMock.getPublishedDay.mockResolvedValue({
      id: 'day-1',
      eventId: 'event-1',
      date: '2026-01-20',
      plan: 'a',
    });
    programItemServiceMock.queryProgramItemsInRange.mockResolvedValue([]);

    const view = await service.getPublicView('event-1', event, '2026-01-20');

    expect(
      programItemServiceMock.queryProgramItemsInRange,
    ).toHaveBeenCalledWith('event-1', {
      from: '2026-01-20',
      to: '2026-01-20',
      plan: 'a',
    });
    expect(view).toMatchObject({
      date: '2026-01-20',
      published: true,
      plan: 'a',
    });
  });

  it('clamps a requested date outside the event to its nearest bound', async () => {
    settingServiceMock.getSetting.mockResolvedValue({
      data: { enabled: true, allowPastDates: true },
    });

    const before = await service.getPublicView('event-1', event, '2020-01-01');
    const after = await service.getPublicView('event-1', event, '2030-01-01');

    expect(before).toMatchObject({ date: '2026-01-01' });
    expect(after).toMatchObject({ date: '2026-01-31' });
  });

  it('allows browsing to a future day within the event, still unpublished', async () => {
    settingServiceMock.getSetting.mockResolvedValue({
      data: { enabled: true, allowPastDates: true },
    });

    const view = await service.getPublicView('event-1', event, '2026-01-25');

    expect(view).toEqual({
      enabled: true,
      date: '2026-01-25',
      minDate: '2026-01-01',
      maxDate: '2026-01-31',
      published: false,
    });
  });

  it('treats a setting row stored before allowPastDates existed as allowing past dates', async () => {
    settingServiceMock.getSetting.mockResolvedValue({
      data: { enabled: true },
    });

    const view = await service.getPublicView('event-1', event, '2026-01-02');

    expect(view).toMatchObject({ minDate: '2026-01-01', date: '2026-01-02' });
  });

  it('clamps browsing to today when allowPastDates is false', async () => {
    settingServiceMock.getSetting.mockResolvedValue({
      data: { enabled: true, allowPastDates: false },
    });

    const view = await service.getPublicView('event-1', event, '2026-01-02');

    expect(view).toMatchObject({ minDate: '2026-01-15', date: '2026-01-15' });
  });

  it('does not raise the min bound when the event has not started yet', async () => {
    vi.setSystemTime(new Date('2025-12-01T12:00:00Z'));
    settingServiceMock.getSetting.mockResolvedValue({
      data: { enabled: true, allowPastDates: false },
    });

    const view = await service.getPublicView('event-1', event);

    expect(view).toMatchObject({ minDate: '2026-01-01' });
  });

  it('does not push the min bound past maxDate when the event has already fully ended', async () => {
    // Real "today" is long after the event's own last day.
    vi.setSystemTime(new Date('2026-06-01T12:00:00Z'));
    settingServiceMock.getSetting.mockResolvedValue({
      data: { enabled: true, allowPastDates: false },
    });

    const view = await service.getPublicView('event-1', event, '2026-01-15');

    // Without clamping `today` into the event's range first, `minDate` would
    // be "today" (2026-06-01) — past `maxDate` (2026-01-31) — making the
    // bounds invalid and pushing `date` outside the event entirely.
    expect(view).toMatchObject({
      minDate: '2026-01-31',
      maxDate: '2026-01-31',
      date: '2026-01-31',
    });
  });
});
