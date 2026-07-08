import { inject, injectable } from 'inversify';
import type { Request, Response } from 'express';
import { BaseController } from '#core/base/BaseController';
import { UserService } from '#app/user/user.service';
import { CampService } from '#app/camp/camp.service';
import { QueueService } from '#app/queue/queue.service';
import { LegalService } from '#app/legal/legal.service';
import { RegistrationService } from '#app/registration/registration.service';
import { AdminOverviewResource } from './admin.resource.js';

@injectable()
export class AdminController extends BaseController {
  constructor(
    @inject(UserService) private readonly userService: UserService,
    @inject(CampService) private readonly campService: CampService,
    @inject(QueueService) private readonly queueService: QueueService,
    @inject(LegalService) private readonly legalService: LegalService,
    @inject(RegistrationService)
    private readonly registrationService: RegistrationService,
  ) {
    super();
  }

  async overview(_req: Request, res: Response) {
    const [users, camps, failedJobs, legal, registrations] = await Promise.all([
      this.userService.getOverviewCounts(),
      this.campService.getOverviewCounts(),
      this.queueService.countFailedJobs(),
      this.legalService.getOverviewCounts(),
      this.registrationService.getOverviewCounts(),
    ]);

    res.resource(
      new AdminOverviewResource({
        users,
        camps,
        queues: { failedJobs },
        legal,
        registrations,
      }),
    );
  }
}
