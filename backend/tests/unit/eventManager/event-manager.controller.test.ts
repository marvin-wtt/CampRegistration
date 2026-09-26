import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { mock } from 'vitest-mock-extended';
import httpStatus from 'http-status';
import type { Event } from '#generated/prisma/client.js';
import ApiError from '#utils/ApiError';
import { EventManagerService } from '#app/eventManager/event-manager.service';
import { UserService } from '#app/user/user.service';
import { RealtimeService } from '#core/realtime/RealtimeService';
import { EventManagerController } from '#app/eventManager/event-manager.controller';
import type { ManagerWithRelationships } from '#app/eventManager/event-manager.resource';

const managerService = mock<EventManagerService>();
const userService = mock<UserService>();
const realtimeService = mock<RealtimeService>();

const controller = new EventManagerController(
  managerService,
  userService,
  realtimeService,
);

const event = { id: 'event-1' } as unknown as Event;

const buildManager = (
  overrides: Partial<ManagerWithRelationships> = {},
): ManagerWithRelationships =>
  ({
    id: 'manager-1',
    eventId: event.id,
    userId: 'user-1',
    role: 'DIRECTOR',
    invitationId: null,
    expiresAt: null,
    user: null,
    invitation: null,
    ...overrides,
  }) as unknown as ManagerWithRelationships;

interface FakeRequestOptions {
  models?: Record<string, unknown>;
  validateResult?: unknown;
}

const fakeRequest = ({
  models = {},
  validateResult = {},
}: FakeRequestOptions = {}): Request =>
  ({
    modelOrFail: (key: string) => models[key],
    validate: vi.fn().mockResolvedValue(validateResult),
  }) as unknown as Request;

const fakeResponse = (): Response & {
  resource: ReturnType<typeof vi.fn>;
  sendStatus: ReturnType<typeof vi.fn>;
} => {
  const res = {} as Response & {
    resource: ReturnType<typeof vi.fn>;
    sendStatus: ReturnType<typeof vi.fn>;
  };
  res.resource = vi.fn().mockReturnValue(res);
  res.sendStatus = vi.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('EventManagerController.update', () => {
  it('rejects demoting the sole director', async () => {
    const manager = buildManager({ role: 'DIRECTOR', expiresAt: null });
    managerService.hasOtherNonExpiringDirector.mockResolvedValue(false);
    const req = fakeRequest({
      models: { event, eventManager: manager },
      validateResult: { body: { role: 'COORDINATOR' } },
    });

    await expect(controller.update(req, fakeResponse())).rejects.toThrow(
      ApiError,
    );
    expect(managerService.hasOtherNonExpiringDirector).toHaveBeenCalledWith(
      event.id,
      manager.id,
    );
    expect(managerService.updateManagerById).not.toHaveBeenCalled();
  });

  it('allows demoting a director when another director remains', async () => {
    const manager = buildManager({ role: 'DIRECTOR', expiresAt: null });
    managerService.hasOtherNonExpiringDirector.mockResolvedValue(true);
    managerService.updateManagerById.mockResolvedValue(
      buildManager({ role: 'COORDINATOR' }),
    );
    const req = fakeRequest({
      models: { event, eventManager: manager },
      validateResult: { body: { role: 'COORDINATOR' } },
    });

    await controller.update(req, fakeResponse());

    expect(managerService.updateManagerById).toHaveBeenCalledWith(manager.id, {
      role: 'COORDINATOR',
      expiresAt: undefined,
    });
  });

  it('rejects adding an expiration to the sole non-expiring director', async () => {
    const manager = buildManager({ role: 'DIRECTOR', expiresAt: null });
    managerService.hasOtherNonExpiringDirector.mockResolvedValue(false);
    const req = fakeRequest({
      models: { event, eventManager: manager },
      validateResult: { body: { expiresAt: '2030-01-01T00:00:00.000Z' } },
    });

    await expect(controller.update(req, fakeResponse())).rejects.toThrow(
      ApiError,
    );
    expect(managerService.hasOtherNonExpiringDirector).toHaveBeenCalledWith(
      event.id,
      manager.id,
    );
    expect(managerService.updateManagerById).not.toHaveBeenCalled();
  });

  it('rejects demoting the sole non-expiring director even when another (expiring) director remains', async () => {
    const manager = buildManager({ role: 'DIRECTOR', expiresAt: null });
    managerService.hasOtherNonExpiringDirector.mockResolvedValue(false);
    const req = fakeRequest({
      models: { event, eventManager: manager },
      validateResult: { body: { role: 'COORDINATOR' } },
    });

    await expect(controller.update(req, fakeResponse())).rejects.toThrow(
      ApiError,
    );
    expect(managerService.updateManagerById).not.toHaveBeenCalled();
  });

  it('allows adding an expiration when another non-expiring director remains', async () => {
    const manager = buildManager({ role: 'DIRECTOR', expiresAt: null });
    managerService.hasOtherNonExpiringDirector.mockResolvedValue(true);
    managerService.updateManagerById.mockResolvedValue(
      buildManager({ expiresAt: new Date('2030-01-01') }),
    );
    const req = fakeRequest({
      models: { event, eventManager: manager },
      validateResult: { body: { expiresAt: '2030-01-01T00:00:00.000Z' } },
    });

    await controller.update(req, fakeResponse());

    expect(managerService.updateManagerById).toHaveBeenCalled();
  });

  it('does not check director invariants for non-director managers', async () => {
    const manager = buildManager({ role: 'COORDINATOR', expiresAt: null });
    managerService.updateManagerById.mockResolvedValue(
      buildManager({ role: 'COORDINATOR', expiresAt: new Date('2030-01-01') }),
    );
    const req = fakeRequest({
      models: { event, eventManager: manager },
      validateResult: { body: { expiresAt: '2030-01-01T00:00:00.000Z' } },
    });

    await controller.update(req, fakeResponse());

    expect(managerService.hasOtherNonExpiringDirector).not.toHaveBeenCalled();
    expect(managerService.updateManagerById).toHaveBeenCalled();
  });

  it('does not re-check invariants on a no-op update that omits role', async () => {
    const manager = buildManager({ role: 'DIRECTOR', expiresAt: null });
    managerService.updateManagerById.mockResolvedValue(manager);
    const req = fakeRequest({
      models: { event, eventManager: manager },
      validateResult: { body: { expiresAt: null } },
    });

    await controller.update(req, fakeResponse());

    expect(managerService.hasOtherNonExpiringDirector).not.toHaveBeenCalled();
    expect(managerService.updateManagerById).toHaveBeenCalled();
  });
});

describe('EventManagerController.destroy', () => {
  it('rejects removing the sole director', async () => {
    const manager = buildManager({ role: 'DIRECTOR', expiresAt: null });
    managerService.hasOtherNonExpiringDirector.mockResolvedValue(false);
    const req = fakeRequest({ models: { event, eventManager: manager } });

    await expect(controller.destroy(req, fakeResponse())).rejects.toThrow(
      ApiError,
    );
    expect(managerService.removeManager).not.toHaveBeenCalled();
  });

  it('rejects removing the sole non-expiring director, even if another (expiring) director remains', async () => {
    const manager = buildManager({ role: 'DIRECTOR', expiresAt: null });
    managerService.hasOtherNonExpiringDirector.mockResolvedValue(false);
    const req = fakeRequest({ models: { event, eventManager: manager } });

    await expect(controller.destroy(req, fakeResponse())).rejects.toThrow(
      ApiError,
    );
    expect(managerService.removeManager).not.toHaveBeenCalled();
  });

  it('allows removing a director when another non-expiring director remains', async () => {
    const manager = buildManager({ role: 'DIRECTOR', expiresAt: null });
    managerService.hasOtherNonExpiringDirector.mockResolvedValue(true);
    const req = fakeRequest({ models: { event, eventManager: manager } });
    const res = fakeResponse();

    await controller.destroy(req, res);

    expect(managerService.removeManager).toHaveBeenCalledWith(manager.id);
    expect(realtimeService.emit).toHaveBeenCalledWith(
      event.id,
      'manager',
      manager.id,
      'deleted',
    );
    expect(res.sendStatus).toHaveBeenCalledWith(httpStatus.NO_CONTENT);
  });

  it('allows removing a non-director manager without checking director invariants', async () => {
    const manager = buildManager({ role: 'COORDINATOR' });
    const req = fakeRequest({ models: { event, eventManager: manager } });

    await controller.destroy(req, fakeResponse());

    expect(managerService.hasOtherNonExpiringDirector).not.toHaveBeenCalled();
    expect(managerService.removeManager).toHaveBeenCalledWith(manager.id);
  });
});
