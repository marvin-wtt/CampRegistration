import { type Request, type Response } from 'express';
import { BaseController } from '#core/base/BaseController';
import { inject, injectable } from 'inversify';
import { LegalService } from './legal.service.js';
import { LegalDocumentResource } from './legal.resource.js';
import validator from './legal.validation.js';

@injectable()
export class LegalController extends BaseController {
  constructor(
    @inject(LegalService) private readonly legalService: LegalService,
  ) {
    super();
  }

  async index(_req: Request, res: Response) {
    const documents = await this.legalService.getAllDocuments();

    res.resource(LegalDocumentResource.collection(documents));
  }

  async show(req: Request, res: Response) {
    const {
      params: { type },
    } = await req.validate(validator.show);

    const document = await this.legalService.getDocument(type);

    res.resource(new LegalDocumentResource(document));
  }

  async update(req: Request, res: Response) {
    const {
      params: { type },
      body: { content },
    } = await req.validate(validator.update);

    const document = await this.legalService.upsertDocument(type, content);

    res.resource(new LegalDocumentResource(document));
  }
}
