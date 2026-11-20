import type { Request } from 'express';
import { hasEventPermission } from '#app/event/event.guard';
import { type GuardFn } from '#core/guard';
import ApiError from '#core/router/ApiError';
import httpStatus from 'http-status';
import { RegistrationService } from '#app/registration/registration.service';
import { EventService } from '#app/event/event.service';
import { resolve } from '#core/ioc/container';
import { PrivacyNoticeService } from '#app/privacyNotice/privacy-notice.service';
import {
  formPrivacyIssues,
  hasPrivacyIssues,
} from '@camp-registration/common/form';

export const registrationFileGuard = async (req: Request): Promise<GuardFn> => {
  const file = req.modelOrFail('file');

  if (!file.registrationId) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Invalid guard handler',
    );
  }

  const registrationService = resolve(RegistrationService);
  const registration = await registrationService.getRegistrationWithEventById(
    file.registrationId,
  );
  if (!registration) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Registration related to file not found',
    );
  }

  const eventService = resolve(EventService);
  const event = await eventService.getEventById(registration.event.id);

  req.setModelOrFail('registration', registration);
  req.setModelOrFail('event', event);

  return hasEventPermission('event.registrations.view');
};

/**
 * Refuses public registrations while the form asks for sensitive data its
 * privacy notice does not cover (docs/privacy.md, section 5). A state rule like
 * `registrationOpen`, not a permission. Applies to every event; forms without
 * privacy tags have nothing to refuse.
 */
export const eventPrivacyCompliant = async (
  req: Request,
): Promise<boolean | string> => {
  const event = req.modelOrFail('event');
  // The notice the create then stamps and checks consents against.
  const { notice } = await resolve(
    PrivacyNoticeService,
  ).getNoticeForRegistration(event.id, event.organizationId);

  return hasPrivacyIssues(formPrivacyIssues(event.form, notice))
    ? 'Registration is unavailable: the form asks for data its privacy information does not cover.'
    : true;
};
