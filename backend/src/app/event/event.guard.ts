import type { Request } from 'express';
import {
  EVENT_COPY_REQUIRED_PERMISSIONS,
  type ScopePermission,
} from '@camp-registration/common/permissions';
import { SettingsRegistry } from '#app/setting/setting.registry';
import { type GuardFn, or } from '#core/guard';
import {
  scoped,
  scopedView,
  type ScopeResolver,
} from '#core/permission/permission.guard';
import type { ModelKey } from '#core/permission/ownership';
import ApiError from '#core/router/ApiError';
import httpStatus from 'http-status';
import { EventService } from '#app/event/event.service';
import { EventManagerService } from '#app/eventManager/event-manager.service';
import { resolve } from '#core/ioc/container';
import { eventRegistrationStatus } from '#app/event/event.util';
import { isRetentionPurged } from '@camp-registration/common/privacy';
import { PrivacyNoticeService } from '#app/privacyNotice/privacy-notice.service';
import {
  formPrivacyIssues,
  hasPrivacyIssues,
} from '@camp-registration/common/form';

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
  options: { own?: ModelKey } = {},
): GuardFn => scoped('event', permission, options);

/** For lists with `?view=all|own`; see {@link scopedView}. */
export const hasEventView = (permission: ScopePermission<'event'>): GuardFn =>
  scopedView('event', permission);

/**
 * A copy carries everything over, so it takes every permission the copy needs
 * on the reference (`EVENT_COPY_PERMISSIONS`). Only the caller's own grants
 * count, never an admin access grant. Reads the raw body, as guards run before
 * validation: a malformed id passes here and fails validation next.
 */
export const canCopyReferenceEvent: GuardFn = async (req) => {
  const id = (req.body as { referenceEventId?: unknown } | undefined)
    ?.referenceEventId;
  if (typeof id !== 'string') {
    return true;
  }

  const authorization = await resolve(
    EventManagerService,
  ).getManagerAuthorization(id, req.authUserId());
  const required = [
    ...EVENT_COPY_REQUIRED_PERMISSIONS,
    ...resolve(SettingsRegistry).viewPermissions(),
  ];

  return required.every((permission) =>
    authorization?.permissions.has(permission),
  );
};

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

/**
 * Once registration data was deleted nobody registers again, managers
 * included (docs/privacy.md, 8). The create re-checks inside its transaction.
 * Thrown, not returned: it holds for everyone, so it is no 401 for a guest.
 */
export const eventNotPurged = (req: Request): true => {
  if (isRetentionPurged(req.modelOrFail('event'))) {
    throw new ApiError(
      httpStatus.CONFLICT,
      'Registration data of this event was deleted; it takes no registrations.',
    );
  }
  return true;
};

/**
 * Refuses registrations while the form asks for sensitive data its privacy
 * notice does not cover (docs/privacy.md, section 5), from managers too: who
 * enters the data does not change what the notice covers.
 */
export const eventPrivacyCompliant = async (req: Request): Promise<true> => {
  const event = req.modelOrFail('event');
  // The notice the create then stamps and checks consents against.
  const { notice } = await resolve(
    PrivacyNoticeService,
  ).getNoticeForRegistration(event.id, event.organizationId);

  // Thrown like `eventNotPurged`: no 401 for a guest.
  if (hasPrivacyIssues(formPrivacyIssues(event.form, notice))) {
    throw new ApiError(
      httpStatus.CONFLICT,
      'Registration is unavailable: the form asks for data its privacy information does not cover.',
    );
  }
  return true;
};

/**
 * Common guard for aoi and meta route
 * @alias
 */
export const eventPubliclyVisible: GuardFn = eventOrganizationVerified;

export const eventViewGuard: GuardFn = or(
  eventPubliclyVisible,
  hasEventPermission('event.view'),
);

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

const eventFileViewGuard = async (req: Request): Promise<GuardFn> => {
  await prepareRequestModels(req);
  const file = req.modelOrFail('file');

  const fileAccess: GuardFn = () => {
    return file.accessLevel === 'public';
  };

  return or(hasEventPermission('event.files.view'), fileAccess);
};

const eventFileEditGuard = async (req: Request): Promise<GuardFn> => {
  await prepareRequestModels(req);

  return hasEventPermission('event.files.edit');
};

const eventFileDeleteGuard = async (req: Request): Promise<GuardFn> => {
  await prepareRequestModels(req);

  return hasEventPermission('event.files.delete');
};

export const eventFileGuards = {
  view: eventFileViewGuard,
  edit: eventFileEditGuard,
  delete: eventFileDeleteGuard,
};
