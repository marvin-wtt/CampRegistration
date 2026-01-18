import httpStatus from 'http-status';
import { AuthService } from '#app/auth/auth.service';
import { UserService } from './user.service.js';
import { UserResource } from './user.resource.js';
import validator from './user.validation.js';
import { type Request, type Response } from 'express';
import { BaseController } from '#core/base/BaseController';
import { inject, injectable } from 'inversify';

@injectable()
export class UserController extends BaseController {
  constructor(
    @inject(AuthService) private readonly authService: AuthService,
    @inject(UserService) private readonly userService: UserService,
  ) {
    super();
  }

  async index(_req: Request, res: Response) {
    const users = await this.userService.queryUsers();

    res.resource(UserResource.collection(users));
  }

  show(req: Request, res: Response) {
    const user = req.modelOrFail('user');

    res.resource(new UserResource(user));
  }

  async store(req: Request, res: Response) {
    const {
      body: { email, password, name, role, locale, locked },
    } = await req.validate(validator.store);

    const user = await this.userService.createUser({
      name,
      email,
      password,
      role,
      locale,
      locked,
    });

    res.status(httpStatus.CREATED).resource(new UserResource(user));
  }

  async update(req: Request, res: Response) {
    const {
      params: { userId },
      body: { email, password, name, role, locale, locked, emailVerified },
    } = await req.validate(validator.update);

    if (password || locked) {
      await this.authService.revokeAllUserTokens(userId);
    }

    const user = await this.userService.updateUserById(userId, {
      name,
      email,
      password,
      role,
      locale,
      locked,
      emailVerified,
    });

    res.resource(new UserResource(user));
  }

  async destroy(req: Request, res: Response) {
    const { userId } = req.params;
    await this.userService.deleteUserById(userId);

    res.sendStatus(httpStatus.NO_CONTENT);
  }
}
