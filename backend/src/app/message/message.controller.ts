import { catchRequestAsync } from '#utils/catchAsync';
import { routeModel } from '#utils/verifyModel';
import messageService from './message.service.js';
import httpStatus from 'http-status';
import { resource } from '#core/resource';
import messageResource from './message.resource.js';
import { MessageCreateData } from '@camp-registration/common/entities';
import registrationService from '#app/registration/registration.service';

const store = catchRequestAsync(async (req, res) => {
  const camp = routeModel(req.models.camp);
  const body = req.body as MessageCreateData;

  // TODO External addresses

  // TODO Get files from storage

  const registrations = await registrationService.queryRegistrationsByIds(
    body.registrations,
  );

  const messageData = registrations.map((registration) => {
    const locale = registrationService.extractRegistrationCountry(registration);
    const recipients =
      registrationService.extractRegistrationEmails(registration);

    return {
      recipients,
      replyTo: body.replyTo,
      subject: body.subject,
      body: body.body,
      priority: body.priority,
      context: {
        camp,
      },
      locale,
      registrationId: registration.id,
      attachments: undefined,
    };
  });

  const message = await messageService.sendMessage({
    recipients: '',
    replyTo: body.replyTo,
    subject: body.subject,
    body: body.body,
    priority: body.priority,
    context: {
      camp,
    },
    locale: undefined,
    registrationId: undefined,
    attachments: undefined,
  });

  res.status(httpStatus.CREATED).json(resource(messageResource(message)));
});

export default {
  store,
};
