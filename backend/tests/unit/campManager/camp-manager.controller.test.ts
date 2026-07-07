import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { mock } from 'vitest-mock-extended';
import httpStatus from 'http-status';
import type { Camp } from '#generated/prisma/client.js';
import ApiError from '#utils/ApiError';
import { CampManagerService } from '#app/campManager/camp-manager.service';
import { UserService } from '#app/user/user.service';
import { RealtimeService } from '#core/realtime/RealtimeService';
import { CampManagerController } from '#app/campManager/camp-manager.controller';
import type { ManagerWithRelationships } from '#app/campManager/camp-manager.resource';

const managerService = mock<CampManagerService>();
const userService = mock<UserService>();
const realtimeService = mock<RealtimeService>();

const controller = new CampManagerController(
  managerService,
  userService,
  realtimeService,
);

const camp = { id: 'camp-1' } as unknown as Camp;

const buildManager = (
  overrides: Partial<ManagerWithRelationships> = {},
): ManagerWithRelationships =>
  ({
    id: 'manager-1',
    campId: camp.id,
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

describe('CampManagerController.update', () => {
  it('rejects demoting the sole director', async () => {
    const manager = buildManager({ role: 'DIRECTOR', expiresAt: null });
    managerService.hasOtherDirector.mockResolvedValue(false);
    const req = fakeRequest({
      models: { camp, campManager: manager },
      validateResult: { body: { role: 'COORDINATOR' } },
    });

    await expect(controller.update(req, fakeResponse())).rejects.toThrow(
      ApiError,
    );
    expect(managerService.hasOtherDirector).toHaveBeenCalledWith(
      camp.id,
      manager.id,
    );
    expect(managerService.updateManagerById).not.toHaveBeenCalled();
  });

  it('allows demoting a director when another director remains', async () => {
    const manager = buildManager({ role: 'DIRECTOR', expiresAt: null });
    managerService.hasOtherDirector.mockResolvedValue(true);
    managerService.hasOtherNonExpiringDirector.mockResolvedValue(true);
    managerService.updateManagerById.mockResolvedValue(
      buildManager({ role: 'COORDINATOR' }),
    );
    const req = fakeRequest({
      models: { camp, campManager: manager },
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
    managerService.hasOtherDirector.mockResolvedValue(true);
    managerService.hasOtherNonExpiringDirector.mockResolvedValue(false);
    const req = fakeRequest({
      models: { camp, campManager: manager },
      validateResult: { body: { expiresAt: '2030-01-01T00:00:00.000Z' } },
    });

    await expect(controller.update(req, fakeResponse())).rejects.toThrow(
      ApiError,
    );
    expect(managerService.hasOtherNonExpiringDirector).toHaveBeenCalledWith(
      camp.id,
      manager.id,
    );
    expect(managerService.updateManagerById).not.toHaveBeenCalled();
  });

  it('rejects demoting the sole non-expiring director even when another (expiring) director remains', async () => {
    const manager = buildManager({ role: 'DIRECTOR', expiresAt: null });
    managerService.hasOtherDirector.mockResolvedValue(true);
    managerService.hasOtherNonExpiringDirector.mockResolvedValue(false);
    const req = fakeRequest({
      models: { camp, campManager: manager },
      validateResult: { body: { role: 'COORDINATOR' } },
    });

    await expect(controller.update(req, fakeResponse())).rejects.toThrow(
      ApiError,
    );
    expect(managerService.updateManagerById).not.toHaveBeenCalled();
  });

  it('allows adding an expiration when another non-expiring director remains', async () => {
    const manager = buildManager({ role: 'DIRECTOR', expiresAt: null });
    managerService.hasOtherDirector.mockResolvedValue(true);
    managerService.hasOtherNonExpiringDirector.mockResolvedValue(true);
    managerService.updateManagerById.mockResolvedValue(
      buildManager({ expiresAt: new Date('2030-01-01') }),
    );
    const req = fakeRequest({
      models: { camp, campManager: manager },
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
      models: { camp, campManager: manager },
      validateResult: { body: { expiresAt: '2030-01-01T00:00:00.000Z' } },
    });

    await controller.update(req, fakeResponse());

    expect(managerService.hasOtherDirector).not.toHaveBeenCalled();
    expect(managerService.hasOtherNonExpiringDirector).not.toHaveBeenCalled();
    expect(managerService.updateManagerById).toHaveBeenCalled();
  });
});

describe('CampManagerController.destroy', () => {
  it('rejects removing the sole director', async () => {
    const manager = buildManager({ role: 'DIRECTOR', expiresAt: null });
    managerService.hasOtherDirector.mockResolvedValue(false);
    const req = fakeRequest({ models: { camp, campManager: manager } });

    await expect(controller.destroy(req, fakeResponse())).rejects.toThrow(
      ApiError,
    );
    expect(managerService.removeManager).not.toHaveBeenCalled();
  });

  it('rejects removing the sole non-expiring director, even if another (expiring) director remains', async () => {
    const manager = buildManager({ role: 'DIRECTOR', expiresAt: null });
    managerService.hasOtherDirector.mockResolvedValue(true);
    managerService.hasOtherNonExpiringDirector.mockResolvedValue(false);
    const req = fakeRequest({ models: { camp, campManager: manager } });

    await expect(controller.destroy(req, fakeResponse())).rejects.toThrow(
      ApiError,
    );
    expect(managerService.removeManager).not.toHaveBeenCalled();
  });

  it('allows removing a director when another non-expiring director remains', async () => {
    const manager = buildManager({ role: 'DIRECTOR', expiresAt: null });
    managerService.hasOtherDirector.mockResolvedValue(true);
    managerService.hasOtherNonExpiringDirector.mockResolvedValue(true);
    const req = fakeRequest({ models: { camp, campManager: manager } });
    const res = fakeResponse();

    await controller.destroy(req, res);

    expect(managerService.removeManager).toHaveBeenCalledWith(manager.id);
    expect(realtimeService.emit).toHaveBeenCalledWith(
      camp.id,
      'manager',
      manager.id,
      'deleted',
    );
    expect(res.sendStatus).toHaveBeenCalledWith(httpStatus.NO_CONTENT);
  });

  it('allows removing a non-director manager without checking director invariants', async () => {
    const manager = buildManager({ role: 'COORDINATOR' });
    const req = fakeRequest({ models: { camp, campManager: manager } });

    await controller.destroy(req, fakeResponse());

    expect(managerService.hasOtherDirector).not.toHaveBeenCalled();
    expect(managerService.removeManager).toHaveBeenCalledWith(manager.id);
  });
});
