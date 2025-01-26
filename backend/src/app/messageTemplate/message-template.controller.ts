import type { Request, Response } from 'express';
import validator from './message-template.validation.js';

class MessageTemplateController {
  async show(req: Request, res: Response) {
    const {} = await req.validate(validator.show);
    // TODO
  }

  async index(req: Request, res: Response) {
    const {} = await req.validate(validator.index);
    // TODO
  }

  async store(req: Request, res: Response) {
    const {} = await req.validate(validator.store);
    // TODO
  }

  async update(req: Request, res: Response) {
    const {} = await req.validate(validator.update);
    // TODO
  }

  async destroy(req: Request, res: Response) {
    const {} = await req.validate(validator.destroy);
    // TODO
  }
}

export default new MessageTemplateController();
