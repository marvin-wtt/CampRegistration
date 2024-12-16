import { catchRequestAsync } from '#utils/catchAsync';
import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';
import { collection, resource } from '#core/resource';
import userService from '#app/user/user.service';
import managerService from './manager.service.js';
import campManagerResource from './manager.resource.js';
import { routeModel } from '#utils/verifyModel';
import { catchAndResolve } from '#utils/promiseUtils';
import validator from './manager.validation.js';
import { validateRequest } from '#core/validation/request';

const index = catchRequestAsync(async (req, res) => {
  const {
    params: { campId },
  } = await validateRequest(req, validator.index);

  const managers = await managerService.getManagers(campId);
  const resources = managers.map((manager) => campManagerResource(manager));

  res.status(httpStatus.OK).json(collection(resources));
});

const store = catchRequestAsync(async (req, res) => {
  const camp = routeModel(req.models.camp);
  const {
    body: { email },
  } = await validateRequest(req, validator.store);

  const existingCampManager = await managerService.getManagerByEmail(
    camp.id,
    email,
  );
  if (existingCampManager) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'User is already a camp manager.',
    );
  }

  const user = await userService.getUserByEmail(email);

  const manager =
    user === null
      ? await managerService.inviteManager(camp.id, email)
      : await managerService.addManager(camp.id, user.id);

  await catchAndResolve(managerService.sendManagerInvitation(camp, manager));

  res.status(httpStatus.CREATED).json(resource(campManagerResource(manager)));
});

const destroy = catchRequestAsync(async (req, res) => {
  const {
    params: { campId, managerId },
  } = await validateRequest(req, validator.destroy);

  const managers = await managerService.getManagers(campId);
  if (managers.length <= 1) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'The camp must always have at least one camp manager.',
    );
  }

  await catchAndResolve(managerService.removeManager(managerId));

  res.sendStatus(httpStatus.NO_CONTENT);
});

export default {
  index,
  store,
  destroy,
};
