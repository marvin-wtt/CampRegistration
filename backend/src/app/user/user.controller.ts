import httpStatus from 'http-status';
import { catchRequestAsync } from 'utils/catchAsync';
import authService from 'app/auth/auth.service';
import userService from './user.service';
import { routeModel } from 'utils/verifyModel';
import { collection, resource } from 'core/resource';
import userResource from './user.resource';
import { validateRequest } from 'core/validation/request';
import validator from './user.validation';

const index = catchRequestAsync(async (req, res) => {
  const users = await userService.queryUsers();

  res.json(collection(users.map(userResource)));
});

const show = catchRequestAsync(async (req, res) => {
  const user = routeModel(req.models.user);

  res.json(resource(userResource(user)));
});

const store = catchRequestAsync(async (req, res) => {
  const {
    body: { email, password, name, role, locale, locked },
  } = await validateRequest(req, validator.store);

  const user = await userService.createUser({
    name,
    email,
    password,
    role,
    locale,
    locked,
  });

  res.status(httpStatus.CREATED).json(resource(user));
});

const update = catchRequestAsync(async (req, res) => {
  const {
    params: { userId },
    body: { email, password, name, role, locale, locked, emailVerified },
  } = await validateRequest(req, validator.update);

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
});

const destroy = catchRequestAsync(async (req, res) => {
  const { userId } = req.params;
  await userService.deleteUserById(userId);

  res.sendStatus(httpStatus.NO_CONTENT);
});

export default {
  index,
  show,
  store,
  update,
  destroy,
};
