import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';
import { collection, resource } from '#core/resource';
import userService from '#app/user/user.service';
import managerService from './manager.service.js';
import campManagerResource from './manager.resource.js';
import { catchAndResolve } from '#utils/promiseUtils';
import validator from './manager.validation.js';
import { type Request, type Response } from 'express';

const index = async (req: Request, res: Response) => {
  const {
    params: { campId },
  } = await req.validate(validator.index);

  const managers = await managerService.getManagers(campId);
  const resources = managers.map((manager) => campManagerResource(manager));

  res.status(httpStatus.OK).json(collection(resources));
};

const store = async (req: Request, res: Response) => {
  const camp = req.modelOrFail('camp');
  const {
    body: { email, expiresAt },
  } = await req.validate(validator.store);

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
  const manager = req.modelOrFail('manager');
  const {
    body: { expiresAt },
  } = await req.validate(validator.update);

  const updatedManager = await managerService.updateManagerById(
    manager.id,
    expiresAt,
  );

  res.status(httpStatus.OK).json(resource(campManagerResource(updatedManager)));
};

const destroy = async (req: Request, res: Response) => {
  const {
    params: { campId, managerId },
  } = await req.validate(validator.destroy);

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
