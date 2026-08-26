import type { Request } from 'express';
import type { ScopePermission } from '@camp-registration/common/permissions';
import { type GuardFn, or } from '#core/guard';
import { scoped, type ScopeResolver } from '#core/permission.guard';
import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';
import { EventService } from '#app/event/event.service';
import { EventManagerService } from '#app/eventManager/event-manager.service';
import { resolve } from '#core/ioc/container';
import { eventRegistrationStatus } from '#app/event/event.util';

export const eventScopeResolver: ScopeResolver<'event'> = {
  model: 'event',
  async resolve(eventId, userId) {
    const authorization = await resolve(
      EventManagerService,
    ).getManagerAuthorization(eventId, userId);

    return authorization?.permissions ?? null;
  },
};

export const hasEventPermission = (
  permission: ScopePermission<'event'>,
): GuardFn => scoped('event', permission);

export const registrationOpen = (req: Request): boolean => {
  const event = req.modelOrFail('event');
  const status = eventRegistrationStatus(event);

  return status === 'open';
};

export const eventOrganizationVerified = (req: Request): boolean => {
  return (
    req.modelOrFail('event').organization.verificationStatus === 'VERIFIED'
  );
};

async function prepareRequestModels(req: Request) {
  const file = req.modelOrFail('file');

  if (!file.eventId) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Invalid file guard handler',
    );
  }

  // Load models for guard
  const eventService = resolve(EventService);
  const event = await eventService.getEventById(file.eventId);
  req.setModelOrFail('event', event);
}

export const eventFileViewGuard = async (req: Request): Promise<GuardFn> => {
  await prepareRequestModels(req);
  const file = req.modelOrFail('file');

  const fileAccess: GuardFn = () => {
    return file.accessLevel === 'public';
  };

  return or(hasEventPermission('event.files.view'), fileAccess);
};

export const eventFileEditGuard = async (req: Request): Promise<GuardFn> => {
  await prepareRequestModels(req);

  return hasEventPermission('event.files.edit');
};

export const eventFileDeleteGuard = async (req: Request): Promise<GuardFn> => {
  await prepareRequestModels(req);

  return hasEventPermission('event.files.delete');
};

export const eventFileGuards = {
  view: eventFileViewGuard,
  edit: eventFileEditGuard,
  delete: eventFileDeleteGuard,
};
