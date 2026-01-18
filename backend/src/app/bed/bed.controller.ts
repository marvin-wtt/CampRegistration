import { BedService } from './bed.service.js';
import { RegistrationService } from '#app/registration/registration.service';
import httpStatus from 'http-status';
import ApiError from '#utils/ApiError';
import validator from './bed.validation.js';
import type { Request, Response } from 'express';
import { BedResource } from '#app/bed/bed.resource';
import { BaseController } from '#core/base/BaseController';
import { inject, injectable } from 'inversify';

@injectable()
export class BedController extends BaseController {
  constructor(
    @inject(BedService) private readonly bedService: BedService,
    @inject(RegistrationService)
    private readonly registrationService: RegistrationService,
  ) {
    super();
  }

  async store(req: Request, res: Response) {
    const {
      params: { campId, roomId },
      body: { registrationId },
    } = await req.validate(validator.store);

    // Validate registrationId is present
    if (registrationId !== undefined) {
      await this.getRegistrationOrFail(campId, registrationId);
    }

    const bed = await this.bedService.createBed(roomId, registrationId);

    res.status(httpStatus.CREATED).resource(new BedResource(bed));
  }

  async update(req: Request, res: Response) {
    const {
      params: { campId, bedId },
      body: { registrationId },
    } = await req.validate(validator.update);

    // Validate registrationId is present
    if (registrationId !== null) {
      await this.getRegistrationOrFail(campId, registrationId);
    }

    const bed = await this.bedService.updateBedById(bedId, registrationId);

    res.resource(new BedResource(bed));
  }

  async destroy(req: Request, res: Response) {
    const {
      params: { bedId },
    } = await req.validate(validator.destroy);

    await this.bedService.deleteBedById(bedId);

    res.sendStatus(httpStatus.NO_CONTENT);
  }

  private async getRegistrationOrFail(campId: string, registrationId: string) {
    const registration = await this.registrationService.getRegistrationById(
      campId,
      registrationId,
    );

    if (registration === null) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid registration id');
    }

    return registration;
  }
}
