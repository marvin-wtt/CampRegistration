import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request } from 'express';
import { mock } from 'vitest-mock-extended';
import * as container from '#core/ioc/container';
import { EventService } from '#app/event/event.service';
import { programPublicSubscriber } from '#app/programPublic/program-public.guard';
import { RESOURCE_VIEW_PERMISSION } from '@camp-registration/common/realtime';

const eventService = mock<EventService>();

vi.spyOn(container, 'resolve').mockReturnValue(eventService);

const fakeReq = (eventId = 'event-1'): Request =>
  ({
    modelOrFail: () => ({ id: eventId }),
  }) as unknown as Request;

const fakeAdminReq = (eventId = 'event-1'): Request =>
  ({
    modelOrFail: () => ({ id: eventId }),
    user: { id: 'admin-1', role: 'ADMIN' },
  }) as unknown as Request;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('programPublicSubscriber', () => {
  it('grants the anonymous public permission set when the organization is verified', async () => {
    eventService.isOrganizationVerified.mockResolvedValue(true);

    const subscriber = await programPublicSubscriber(fakeReq());

    expect(eventService.isOrganizationVerified).toHaveBeenCalledWith('event-1');
    expect(subscriber).toEqual({
      managerId: '',
      permissions: new Set([
        RESOURCE_VIEW_PERMISSION.program_item,
        RESOURCE_VIEW_PERMISSION.setting,
      ]),
      expiresAt: null,
      revalidate: true,
    });
  });

  it('refuses the stream when the organization is not verified', async () => {
    eventService.isOrganizationVerified.mockResolvedValue(false);

    const subscriber = await programPublicSubscriber(fakeReq());

    expect(subscriber).toBeNull();
  });

  it('grants access to an admin without checking organization verification', async () => {
    const subscriber = await programPublicSubscriber(fakeAdminReq());

    expect(eventService.isOrganizationVerified).not.toHaveBeenCalled();
    expect(subscriber).toEqual({
      managerId: '',
      permissions: new Set([
        RESOURCE_VIEW_PERMISSION.program_item,
        RESOURCE_VIEW_PERMISSION.setting,
      ]),
      expiresAt: null,
    });
  });
});
