import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';
import userService from '#app/user/user.service';
import managerService from '#app/manager/manager.service';
import { ManagerResource } from '#app/manager/manager.resource';
import { catchAndResolve } from '#utils/promiseUtils';
import validator from '#app/manager/manager.validation';
import { type Request, type Response } from 'express';
import managerMessages from '#app/manager/manager.messages';
import { BaseController } from '#core/base/BaseController';

class ManagerController extends BaseController {
  async index(req: Request, res: Response) {
    const {
      params: { campId },
    } = await req.validate(validator.index);

    const managers = await managerService.getManagers(campId);

    res.resource(ManagerResource.collection(managers));
  }

  async store(req: Request, res: Response) {
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

    await catchAndResolve(managerMessages.sendManagerInvitation(camp, manager));

    res.status(httpStatus.CREATED).resource(new ManagerResource(manager));
  }

  async update(req: Request, res: Response) {
    const manager = req.modelOrFail('manager');
    const {
      body: { expiresAt },
    } = await req.validate(validator.update);

    const updatedManager = await managerService.updateManagerById(
      manager.id,
      expiresAt,
    );

    res.resource(new ManagerResource(updatedManager));
  }

  async destroy(req: Request, res: Response) {
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
  }
}

export default new ManagerController();
