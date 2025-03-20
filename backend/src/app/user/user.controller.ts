import httpStatus from 'http-status';
import authService from '#app/auth/auth.service';
import userService from './user.service.js';
import { UserResource } from './user.resource.js';
import validator from './user.validation.js';
import { type Request, type Response } from 'express';

const index = async (_req: Request, res: Response) => {
  const users = await userService.queryUsers();

  res.resource(UserResource.collection(users));
};

const show = (req: Request, res: Response) => {
  const user = req.modelOrFail('user');

  res.resource(new UserResource(user));
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

  res.status(httpStatus.CREATED).resource(new UserResource(user));
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

  res.resource(new UserResource(user));
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
