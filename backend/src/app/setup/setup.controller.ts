import httpStatus from 'http-status';
import { type Request, type Response } from 'express';
import { SetupService } from '#app/setup/setup.service';
import { AuthController } from '#app/auth/auth.controller';
import { BaseController } from '#core/base/BaseController';
import validator from './setup.validation.js';
import { inject, injectable } from 'inversify';

@injectable()
export class SetupController extends BaseController {
  constructor(
    @inject(SetupService) private readonly setupService: SetupService,
    @inject(AuthController) private readonly authController: AuthController,
  ) {
    super();
  }

  async status(_req: Request, res: Response) {
    const required = await this.setupService.isSetupRequired();

    res.json({ required });
  }

  async setup(req: Request, res: Response) {
    const {
      body: { name, email, password },
    } = await req.validate(validator.setup);
    const locale = req.preferredLocale();

    const user = await this.setupService.createInitialAdmin({
      name,
      email,
      password,
      locale,
    });

    // Establish a session immediately so the new admin lands logged in.
    res.status(httpStatus.CREATED);
    await this.authController.sendAuthResponse(req, res, user.id, true);
  }
}
