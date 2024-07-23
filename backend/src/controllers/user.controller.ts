import httpStatus from 'http-status';
import { catchRequestAsync } from 'utils/catchAsync';
import { authService, userService } from 'services';
import { routeModel } from 'utils/verifyModel';
import { collection, resource } from '../resources/resource';
import { userResource } from 'resources';

const index = catchRequestAsync(async (req, res) => {
  const users = await userService.queryUsers();

  res.json(collection(users.map(userResource)));
});

const show = catchRequestAsync(async (req, res) => {
  const user = routeModel(req.models.user);

  res.json(resource(userResource(user)));
});

const store = catchRequestAsync(async (req, res) => {
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
});

const update = catchRequestAsync(async (req, res) => {
  const { userId } = req.params;
  const { email, password, name, role, locale, locked, emailVerified } =
    req.body;

  if (password) {
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
