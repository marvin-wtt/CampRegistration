import httpStatus from 'http-status';
import pick from 'utils/pick';
import { catchRequestAsync } from 'utils/catchAsync';
import { authService, userService } from 'services';
import exclude from 'utils/exclude';
import { routeModel } from 'utils/verifyModel';
import ApiError from 'utils/ApiError';
import { authUserId } from 'utils/authUserId';
import { Role } from '@prisma/client';
import { collection, resource } from '../resources/resource';
import { userResource } from 'resources';

const index = catchRequestAsync(async (req, res) => {
  const filter = exclude(req.query, ['sortBy', 'limit', 'page']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const users = await userService.queryUsers(filter, options);

  res.json(collection(users.map(userResource)));
});

const show = catchRequestAsync(async (req, res) => {
  const user = routeModel(req.models.user);

  res.json(resource(userResource(user)));
});

const store = catchRequestAsync(async (req, res) => {
  const { email, password, name, role, locale } = req.body;
  const user = await userService.createUser({
    name,
    email,
    password,
    role,
    locale,
  });

  res.status(httpStatus.CREATED).json(resource(user));
});

const update = catchRequestAsync(async (req, res) => {
  const { userId } = req.params;
  const { email, password, name, role, locale, locked, emailVerified } =
    req.body;
  const authId = authUserId(req);
  const authUser = await userService.getUserById(authId);

  const adminPermissionsRequired = locked !== undefined || role !== undefined;
  if (adminPermissionsRequired && authUser?.role !== Role.ADMIN) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Insufficient permission');
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
