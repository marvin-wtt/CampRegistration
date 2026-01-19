import httpStatus from 'http-status';
import { RegistrationService } from '#app/registration/registration.service';
import { BaseController } from '#core/base/BaseController';
import type { Request, Response } from 'express';
import validator from '#app/message/message.validation';
import { MessageTemplateService } from '#app/messageTemplate/message-template.service';
import ApiError from '#utils/ApiError';
import { RegistrationTemplateMessage } from '#app/registration/registration.messages';
import { MessageTemplateResource } from '#app/messageTemplate/message-template.resource';
import { inject, injectable } from 'inversify';

@injectable()
export class MessageController extends BaseController {
  constructor(
    @inject(RegistrationService)
    private readonly registrationService: RegistrationService,
    @inject(MessageTemplateService)
    private readonly messageTemplateService: MessageTemplateService,
  ) {
    super();
  }

  index(_req: Request, res: Response) {
    res.sendStatus(httpStatus.NOT_IMPLEMENTED);
  }

  show(_req: Request, res: Response) {
    res.sendStatus(httpStatus.NOT_IMPLEMENTED);
  }

  async store(req: Request, res: Response) {
    const camp = req.modelOrFail('camp');
    const {
      body: {
        subject,
        body,
        priority,
        replyTo,
        registrationIds,
        attachmentIds,
      },
    } = await req.validate(validator.store);

    const registrations = await this.registrationService.getRegistrationsByIds(
      camp.id,
      registrationIds,
    );

    // Throw error if not all ids were found
    if (registrations.length !== registrationIds.length) {
      const missingIds = registrationIds.filter(
        (id) => !registrations.some((registration) => registration.id === id),
      );

      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Invalid registration id(s): [${missingIds.join(', ')}]`,
      );
    }

    const template = await this.messageTemplateService.createTemplate(
      camp.id,
      { subject, body, priority, replyTo, attachmentIds },
      req.sessionId,
    );

    await Promise.all(
      registrations.map((registration) =>
        RegistrationTemplateMessage.enqueueFor(camp, registration, template),
      ),
    );

    res
      .status(httpStatus.CREATED)
      .resource(new MessageTemplateResource(template));
  }

  async resend(req: Request, res: Response) {
    await req.validate(validator.resend);

    // TODO Create and enqueue new message

    res.sendStatus(httpStatus.NOT_IMPLEMENTED);
  }

  destroy(_req: Request, res: Response) {
    res.sendStatus(httpStatus.NOT_IMPLEMENTED);
  }
}
