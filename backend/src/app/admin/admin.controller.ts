import { inject, injectable } from 'inversify';
import type { Request, Response } from 'express';
import { BaseController } from '#core/base/BaseController';
import { UserService } from '#app/user/user.service';
import { EventService } from '#app/event/event.service';
import { QueueService } from '#app/queue/queue.service';
import { LegalService } from '#app/legal/legal.service';
import { RegistrationService } from '#app/registration/registration.service';
import { AdminOverviewResource } from './admin.resource.js';
import { FileService } from '#app/file/file.service';
import { OrganizationService } from '#app/organization/organization.service';

@injectable()
export class AdminController extends BaseController {
  constructor(
    @inject(UserService) private readonly userService: UserService,
    @inject(OrganizationService)
    private readonly organizationService: OrganizationService,
    @inject(EventService) private readonly eventService: EventService,
    @inject(QueueService) private readonly queueService: QueueService,
    @inject(LegalService) private readonly legalService: LegalService,
    @inject(FileService) private readonly fileService: FileService,
    @inject(RegistrationService)
    private readonly registrationService: RegistrationService,
  ) {
    super();
  }

  async overview(_req: Request, res: Response) {
    const [
      users,
      organizations,
      events,
      failedJobs,
      legal,
      files,
      registrations,
    ] = await Promise.all([
      this.userService.getOverviewCounts(),
      this.organizationService.getOverviewCounts(),
      this.eventService.getOverviewCounts(),
      this.queueService.countFailedJobs(),
      this.legalService.getOverviewCounts(),
      this.fileService.getOverviewCounts(),
      this.registrationService.getOverviewCounts(),
    ]);

    res.resource(
      new AdminOverviewResource({
        users,
        organizations,
        events,
        queues: { failedJobs },
        legal,
        files,
        registrations,
      }),
    );
  }
}
