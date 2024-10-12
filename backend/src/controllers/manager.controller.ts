import { catchRequestAsync } from 'utils/catchAsync';
import ApiError from 'utils/ApiError';
import httpStatus from 'http-status';
import { collection, resource } from 'resources/resource';
import { managerService, userService } from 'services';
import { campManagerResource } from 'resources';
import { routeModel } from 'utils/verifyModel';
import { catchAndResolve } from '../utils/promiseUtils';

const index = catchRequestAsync(async (req, res) => {
  const { campId } = req.params;

  const managers = await managerService.getManagers(campId);
  const resources = managers.map((manager) => campManagerResource(manager));

  res.status(httpStatus.OK).json(collection(resources));
});

const store = catchRequestAsync(async (req, res) => {
  const camp = routeModel(req.models.camp);
  const { email } = req.body;

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
  const { campId, managerId } = req.params;

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
