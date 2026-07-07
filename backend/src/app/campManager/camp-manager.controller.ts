import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';
import { UserService } from '#app/user/user.service';
import { CampManagerService } from '#app/campManager/camp-manager.service.js';
import { CampManagerResource } from '#app/campManager/camp-manager.resource.js';
import validator from '#app/campManager/camp-manager.validation';
import { type Request, type Response } from 'express';
import { CampManagerInvitationMessage } from '#app/campManager/camp-manager.messages';
import { BaseController } from '#core/base/BaseController';
import { RealtimeService } from '#core/realtime/RealtimeService';
import { inject, injectable } from 'inversify';

@injectable()
export class CampManagerController extends BaseController {
  constructor(
    @inject(CampManagerService)
    private readonly managerService: CampManagerService,
    @inject(UserService) private readonly userService: UserService,
    @inject(RealtimeService)
    private readonly realtimeService: RealtimeService,
  ) {
    super();
  }

  async index(req: Request, res: Response) {
    const {
      params: { campId },
    } = await req.validate(validator.index);

    const managers = await this.managerService.getManagers(campId);

    res.resource(CampManagerResource.collection(managers));
  }

  async store(req: Request, res: Response) {
    const camp = req.modelOrFail('camp');
    const {
      body: { email, role, expiresAt },
    } = await req.validate(validator.store);

    const existingCampManager = await this.managerService.getManagerByEmail(
      camp.id,
      email,
    );
    if (existingCampManager) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'User is already a camp manager.',
      );
    }

    const user = await this.userService.getUserByEmail(email);

    const data = {
      role,
      expiresAt,
    };

    const manager =
      user === null
        ? await this.managerService.inviteManager(camp.id, email, data)
        : await this.managerService.addManager(camp.id, user.id, data);

    await CampManagerInvitationMessage.enqueue({
      camp,
      manager,
    });

    await this.realtimeService.emit(camp.id, 'manager', manager.id, 'created');

    res.status(httpStatus.CREATED).resource(new CampManagerResource(manager));
  }

  async update(req: Request, res: Response) {
    const manager = req.modelOrFail('campManager');
    const {
      body: { role, expiresAt },
    } = await req.validate(validator.update);

    const updatedManager = await this.managerService.updateManagerById(
      manager.id,
      {
        role,
        expiresAt,
      },
    );

    await this.realtimeService.emit(
      updatedManager.campId,
      'manager',
      updatedManager.id,
      'updated',
    );

    res.resource(new CampManagerResource(updatedManager));
  }

  async destroy(req: Request, res: Response) {
    const {
      params: { campId, campManagerId },
    } = await req.validate(validator.destroy);

    const managers = await this.managerService.getManagers(campId);
    if (managers.length <= 1) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'The camp must always have at least one camp manager.',
      );
    }

    await this.managerService.removeManager(campManagerId);

    await this.realtimeService.emit(
      campId,
      'manager',
      campManagerId,
      'deleted',
    );

    res.sendStatus(httpStatus.NO_CONTENT);
  }
}
