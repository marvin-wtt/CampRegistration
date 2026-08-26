import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';
import { UserService } from '#app/user/user.service';
import { EventManagerService } from '#app/eventManager/event-manager.service.js';
import { EventManagerResource } from '#app/eventManager/event-manager.resource.js';
import validator from '#app/eventManager/event-manager.validation';
import { type Request, type Response } from 'express';
import { EventManagerInvitationMessage } from '#app/eventManager/event-manager.messages';
import { BaseController } from '#core/base/BaseController';
import { RealtimeService } from '#core/realtime/RealtimeService';
import { inject, injectable } from 'inversify';

@injectable()
export class EventManagerController extends BaseController {
  constructor(
    @inject(EventManagerService)
    private readonly managerService: EventManagerService,
    @inject(UserService) private readonly userService: UserService,
    @inject(RealtimeService)
    private readonly realtimeService: RealtimeService,
  ) {
    super();
  }

  async index(req: Request, res: Response) {
    const event = req.modelOrFail('event');
    await req.validate(validator.index);

    const managers = await this.managerService.getManagers(event.id);

    res.resource(EventManagerResource.collection(managers));
  }

  async show(req: Request, res: Response) {
    await req.validate(validator.show);
    const manager = req.modelOrFail('eventManager');

    res.resource(new EventManagerResource(manager));
  }

  async store(req: Request, res: Response) {
    const event = req.modelOrFail('event');
    const {
      body: { email, role, expiresAt },
    } = await req.validate(validator.store);

    const existingEventManager = await this.managerService.getManagerByEmail(
      event.id,
      email,
    );
    if (existingEventManager) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'User is already a event manager.',
      );
    }

    const user = await this.userService.getUserByEmail(email);

    const data = {
      role,
      expiresAt,
    };

    const manager =
      user === null
        ? await this.managerService.inviteManager(event.id, email, data)
        : await this.managerService.addManager(event.id, user.id, data);

    await EventManagerInvitationMessage.enqueue({
      event,
      manager,
    });

    void this.realtimeService.emit(event.id, 'manager', manager.id, 'created');

    res.status(httpStatus.CREATED).resource(new EventManagerResource(manager));
  }

  async update(req: Request, res: Response) {
    const event = req.modelOrFail('event');
    const manager = req.modelOrFail('eventManager');
    const {
      body: { role, expiresAt },
    } = await req.validate(validator.update);

    // Verify the event has another non-expiring director available.
    const nextRole = role ?? manager.role;
    const nextExpiresAt =
      expiresAt === undefined ? manager.expiresAt : expiresAt;
    if (
      manager.role === 'DIRECTOR' &&
      manager.expiresAt === null &&
      (nextRole !== 'DIRECTOR' || nextExpiresAt !== null)
    ) {
      await this.checkDirectorConstraints(event.id, manager.id);
    }

    const updatedManager = await this.managerService.updateManagerById(
      manager.id,
      {
        role,
        expiresAt,
      },
    );

    void this.realtimeService.emit(
      event.id,
      'manager',
      updatedManager.id,
      'updated',
    );

    res.resource(new EventManagerResource(updatedManager));
  }

  async destroy(req: Request, res: Response) {
    const event = req.modelOrFail('event');
    const manager = req.modelOrFail('eventManager');
    await req.validate(validator.destroy);

    // Verify the event has another non-expiring director available.
    if (manager.role === 'DIRECTOR' && manager.expiresAt === null) {
      await this.checkDirectorConstraints(event.id, manager.id);
    }

    await this.managerService.removeManager(manager.id);

    void this.realtimeService.emit(event.id, 'manager', manager.id, 'deleted');

    res.sendStatus(httpStatus.NO_CONTENT);
  }

  private async checkDirectorConstraints(eventId: string, managerId: string) {
    const hasOtherDirector =
      await this.managerService.hasOtherNonExpiringDirector(eventId, managerId);

    if (!hasOtherDirector) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'The event must always have a event manager with the director role that does not expire.',
      );
    }
  }
}
