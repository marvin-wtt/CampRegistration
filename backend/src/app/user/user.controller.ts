import httpStatus from 'http-status';
import authService from 'app/auth/auth.service';
import userService from './user.service';
import { routeModel } from 'utils/verifyModel';
import { collection, resource } from 'app/resource';
import userResource from './user.resource';
import { Request, Response } from 'express';

const index = async (req: Request, res: Response) => {
  const users = await userService.queryUsers();

  res.json(collection(users.map(userResource)));
};

const show = async (req: Request, res: Response) => {
  const user = routeModel(req.models.user);

  res.json(resource(userResource(user)));
};

const store = async (req: Request, res: Response) => {
  const { email, password, name, role, locale, locked } = req.body;
  const user = await userService.createUser({
    name,
    email,
    password,
    role,
    locale,
    locked,
  });

  res.status(httpStatus.CREATED).json(resource(user));
};

const update = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { email, password, name, role, locale, locked, emailVerified } =
    req.body;

  if (password || locked) {
    await authService.logoutAllDevices(userId);
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
