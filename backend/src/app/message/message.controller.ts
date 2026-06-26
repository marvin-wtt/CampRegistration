import httpStatus from 'http-status';
import { RegistrationService } from '#app/registration/registration.service';
import { BaseController } from '#core/base/BaseController';
import type { Request, Response } from 'express';
import validator from '#app/message/message.validation';
import { MessageTemplateService } from '#app/messageTemplate/message-template.service';
import ApiError from '#utils/ApiError';
import { RegistrationTemplateMessage } from '#app/registration/registration.messages';
import { MessageTemplateResource } from '#app/messageTemplate/message-template.resource';
import { FileResource } from '#app/file/file.resource';
import { inject, injectable } from 'inversify';
import { sanitizeEmailHtml } from '#utils/sanitize';

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

  async index(req: Request, res: Response) {
    const {
      params: { campId },
    } = await req.validate(validator.index);

    // Sent messages are ad-hoc templates (event === null); event templates are
    // the reusable automated ones and are governed by the message-template
    // permissions, not these.
    const messages = await this.messageTemplateService.queryMessageTemplates(
      campId,
      { hasEvent: false },
    );

    res
      .status(httpStatus.OK)
      .resource(MessageTemplateResource.collection(messages));
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
      {
        subject,
        body: sanitizeEmailHtml(body),
        priority,
        replyTo,
        attachmentIds,
      },
      req.sessionId,
    );

    await RegistrationTemplateMessage.enqueueForAll(
      camp,
      registrations,
      template,
    );

    // The per-recipient messages are processed asynchronously, so expose the
    // targeted registrations directly on the response.
    res.status(httpStatus.CREATED).resource(
      new MessageTemplateResource({
        ...template,
        messages: registrations.map((registration) => ({
          registrationId: registration.id,
          to: null,
        })),
      }),
    );
  }

  async resend(req: Request, res: Response) {
    await req.validate(validator.resend);

    // TODO Create and enqueue new message

    res.sendStatus(httpStatus.NOT_IMPLEMENTED);
  }

  async destroy(req: Request, res: Response) {
    const {
      params: { campId, messageId },
    } = await req.validate(validator.destroy);

    await this.getSentMessageOrFail(campId, messageId);

    await this.messageTemplateService.deleteMessageTemplateById(
      messageId,
      campId,
    );

    res.sendStatus(httpStatus.NO_CONTENT);
  }

  async duplicateAttachments(req: Request, res: Response) {
    const {
      params: { campId, messageId },
    } = await req.validate(validator.duplicateAttachments);

    await this.getSentMessageOrFail(campId, messageId);

    const files =
      await this.messageTemplateService.duplicateAttachmentsToSession(
        campId,
        messageId,
        req.sessionId,
      );

    res
      .status(httpStatus.CREATED)
      .resource(FileResource.collection(files ?? []));
  }

  /**
   * Loads a sent message (ad-hoc template with `event === null`) and throws 404
   * for unknown ids or for reusable automated templates (`event !== null`),
   * which are governed by the message-template permissions instead.
   */
  private async getSentMessageOrFail(campId: string, messageId: string) {
    const template = await this.messageTemplateService.getMessageTemplateById(
      campId,
      messageId,
    );

    if (template?.event !== null) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Message not found');
    }

    return template;
  }
}
