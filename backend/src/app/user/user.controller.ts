import httpStatus from 'http-status';
import authService from '#app/auth/auth.service';
import userService from './user.service.js';
import { collection, resource } from '#core/resource';
import userResource from './user.resource.js';
import validator from './user.validation.js';
import { type Request, type Response } from 'express';

const index = async (_req: Request, res: Response) => {
  const users = await userService.queryUsers();

  res.json(collection(users.map(userResource)));
};

const show = (req: Request, res: Response) => {
  const user = req.modelOrFail('user');

  res.json(resource(userResource(user)));
};

const store = async (req: Request, res: Response) => {
  const {
    body: { email, password, name, role, locale, locked },
  } = await req.validate(validator.store);

  const user = await userService.createUser({
    name,
    email,
    password,
    role,
    locale,
    locked,
  });

  res.status(httpStatus.CREATED).json(resource(userResource(user)));
};

const update = async (req: Request, res: Response) => {
  const {
    params: { userId },
    body: { email, password, name, role, locale, locked, emailVerified },
  } = await req.validate(validator.update);

  if (password || locked) {
    await authService.revokeAllUserTokens(userId);
  }

  const user = await userService.updateUserById(userId, {
    name,
    email,
    password,
    role,
    locale,
    locked,
    emailVerified,
  });

  res.json(resource(user));
};

const destroy = async (req: Request, res: Response) => {
  const { userId } = req.params;
  await userService.deleteUserById(userId);

  res.sendStatus(httpStatus.NO_CONTENT);
};

export default {
  index,
  show,
  store,
  update,
  destroy,
};
