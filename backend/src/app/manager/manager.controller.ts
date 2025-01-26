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
import { type Request, type Response } from 'express';

const index = async (req: Request, res: Response) => {
  const {
    params: { campId },
  } = await validateRequest(req, validator.index);

  const managers = await managerService.getManagers(campId);
  const resources = managers.map((manager) => campManagerResource(manager));

  res.status(httpStatus.OK).json(collection(resources));
};

const store = async (req: Request, res: Response) => {
  const camp = routeModel(req.models.camp);
  const {
    body: { email, expiresAt },
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
      ? await managerService.inviteManager(camp.id, email, expiresAt)
      : await managerService.addManager(camp.id, user.id, expiresAt);

  await catchAndResolve(managerService.sendManagerInvitation(camp, manager));

  res.status(httpStatus.CREATED).json(resource(campManagerResource(manager)));
};

const update = async (req: Request, res: Response) => {
  const manager = routeModel(req.models.manager);
  const {
    body: { expiresAt },
  } = await validateRequest(req, validator.update);

  const updatedManager = await managerService.updateManagerById(
    manager.id,
    expiresAt,
  );

  res.status(httpStatus.OK).json(resource(campManagerResource(updatedManager)));
};

const destroy = async (req: Request, res: Response) => {
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
};

export default {
  index,
  store,
  update,
  destroy,
};
