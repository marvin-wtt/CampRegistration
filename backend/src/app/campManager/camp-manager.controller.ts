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
    const camp = req.modelOrFail('camp');
    await req.validate(validator.index);

    const managers = await this.managerService.getManagers(camp.id);

    res.resource(CampManagerResource.collection(managers));
  }

  async show(req: Request, res: Response) {
    await req.validate(validator.show);
    const manager = req.modelOrFail('campManager');

    res.resource(new CampManagerResource(manager));
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

    void this.realtimeService.emit(camp.id, 'manager', manager.id, 'created');

    res.status(httpStatus.CREATED).resource(new CampManagerResource(manager));
  }

  async update(req: Request, res: Response) {
    const camp = req.modelOrFail('camp');
    const manager = req.modelOrFail('campManager');
    const {
      body: { role, expiresAt },
    } = await req.validate(validator.update);

    const wasDirector = manager.role === 'DIRECTOR';
    const willBeDirector = (role ?? manager.role) === 'DIRECTOR';
    const willExpire =
      (expiresAt !== undefined ? expiresAt : manager.expiresAt) !== null;

    if (wasDirector && !willBeDirector) {
      const hasOtherDirector = await this.managerService.hasOtherDirector(
        camp.id,
        manager.id,
      );
      if (!hasOtherDirector) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'The camp must always have at least one camp manager with the director role.',
        );
      }
    }

    if (
      wasDirector &&
      manager.expiresAt === null &&
      (!willBeDirector || willExpire)
    ) {
      const hasOtherNonExpiringDirector =
        await this.managerService.hasOtherNonExpiringDirector(
          camp.id,
          manager.id,
        );
      if (!hasOtherNonExpiringDirector) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'The camp must always have a camp manager with the director role that does not expire.',
        );
      }
    }

    const updatedManager = await this.managerService.updateManagerById(
      manager.id,
      {
        role,
        expiresAt,
      },
    );

    void this.realtimeService.emit(
      camp.id,
      'manager',
      updatedManager.id,
      'updated',
    );

    res.resource(new CampManagerResource(updatedManager));
  }

  async destroy(req: Request, res: Response) {
    const camp = req.modelOrFail('camp');
    const manager = req.modelOrFail('campManager');
    await req.validate(validator.destroy);

    if (manager.role === 'DIRECTOR') {
      const hasOtherDirector = await this.managerService.hasOtherDirector(
        camp.id,
        manager.id,
      );
      if (!hasOtherDirector) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'The camp must always have at least one camp manager with the director role.',
        );
      }

      if (manager.expiresAt === null) {
        const hasOtherNonExpiringDirector =
          await this.managerService.hasOtherNonExpiringDirector(
            camp.id,
            manager.id,
          );
        if (!hasOtherNonExpiringDirector) {
          throw new ApiError(
            httpStatus.BAD_REQUEST,
            'The camp must always have a camp manager with the director role that does not expire.',
          );
        }
      }
    }

    await this.managerService.removeManager(manager.id);

    void this.realtimeService.emit(camp.id, 'manager', manager.id, 'deleted');

    res.sendStatus(httpStatus.NO_CONTENT);
  }
}
