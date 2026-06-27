import httpStatus from 'http-status';
import { RegistrationService } from '#app/registration/registration.service';
import { BaseController } from '#core/base/BaseController';
import type { Request, Response } from 'express';
import validator from '#app/message/message.validation';
import { MessageService } from '#app/message/message.service';
import ApiError from '#utils/ApiError';
import {
  messageToRenderable,
  RegistrationTemplateMessage,
} from '#app/registration/registration.messages';
import { MessageResource } from '#app/message/message.resource';
import { FileResource } from '#app/file/file.resource';
import { inject, injectable } from 'inversify';
import { FileService } from '#app/file/file.service';

@injectable()
export class MessageController extends BaseController {
  constructor(
    @inject(RegistrationService)
    private readonly registrationService: RegistrationService,
    @inject(MessageService)
    private readonly messageService: MessageService,
    @inject(FileService)
    private readonly fileService: FileService,
  ) {
    super();
  }

  async index(req: Request, res: Response) {
    await req.validate(validator.index);
    const camp = req.modelOrFail('camp');

    const messages = await this.messageService.queryMessages(camp.id);

    res.status(httpStatus.OK).resource(MessageResource.collection(messages));
  }

  async show(req: Request, res: Response) {
    await req.validate(validator.show);
    const message = req.modelOrFail('message');

    res.resource(new MessageResource(message));
  }

  async store(req: Request, res: Response) {
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
    const camp = req.modelOrFail('camp');

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

    const message = await this.messageService.createMessage(
      camp.id,
      {
        subject,
        body,
        priority,
        replyTo,
        attachmentIds,
      },
      req.sessionId,
    );

    await RegistrationTemplateMessage.enqueueForAll(
      camp,
      registrations,
      messageToRenderable(message),
    );

    // The per-recipient deliveries are processed asynchronously, so expose the
    // targeted registrations directly on the response.
    res.status(httpStatus.CREATED).resource(
      new MessageResource({
        ...message,
        deliveries: registrations.map((registration) => ({
          registrationId: registration.id,
          to: null,
        })),
      }),
    );
  }

  async resend(req: Request, res: Response) {
    await req.validate(validator.resend);

    // TODO Create and enqueue new delivery

    res.sendStatus(httpStatus.NOT_IMPLEMENTED);
  }

  async destroy(req: Request, res: Response) {
    await req.validate(validator.destroy);
    const message = req.modelOrFail('message');

    await this.messageService.deleteMessageById(message.id, message.campId);

    res.sendStatus(httpStatus.NO_CONTENT);
  }

  async duplicateAttachments(req: Request, res: Response) {
    await req.validate(validator.duplicateAttachments);
    const message = req.modelOrFail('message');

    const files = await this.fileService.duplicateFiles(
      message.attachments,
      req.sessionId,
    );

    res.status(httpStatus.CREATED).resource(FileResource.collection(files));
  }
}
