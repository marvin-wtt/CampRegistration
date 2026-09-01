import httpStatus from 'http-status';
import ApiError from '#utils/ApiError';
import { DutyAssignmentService } from './dutyAssignment.service.js';
import { DutyAssignmentResource } from './dutyAssignment.resource.js';
import validator from './dutyAssignment.validation.js';
import { type Request, type Response } from 'express';
import { BaseController } from '#core/base/BaseController';
import { RealtimeService } from '#core/realtime/RealtimeService';
import { DutyService } from '#app/duty/duty.service';
import { RegistrationService } from '#app/registration/registration.service';
import { inject, injectable } from 'inversify';

@injectable()
export class DutyAssignmentController extends BaseController {
  constructor(
    @inject(DutyAssignmentService)
    private readonly dutyAssignmentService: DutyAssignmentService,
    @inject(DutyService) private readonly dutyService: DutyService,
    @inject(RegistrationService)
    private readonly registrationService: RegistrationService,
    @inject(RealtimeService)
    private readonly realtimeService: RealtimeService,
  ) {
    super();
  }

  show(req: Request, res: Response) {
    const dutyAssignment = req.modelOrFail('dutyAssignment');

    res.resource(new DutyAssignmentResource(dutyAssignment));
  }

  async index(req: Request, res: Response) {
    const event = req.modelOrFail('event');
    await req.validate(validator.index);

    const assignments = await this.dutyAssignmentService.queryDutyAssignments(
      event.id,
    );

    res.resource(DutyAssignmentResource.collection(assignments));
  }

  async suggestions(req: Request, res: Response) {
    const event = req.modelOrFail('event');
    const {
      query: { dutyId, unit },
    } = await req.validate(validator.suggestions);

    const suggestions = await this.dutyAssignmentService.getSuggestions(
      event.id,
      dutyId,
      unit,
    );

    if (!suggestions) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Duty not found');
    }

    res.json({ data: suggestions, meta: {} });
  }

  async store(req: Request, res: Response) {
    const event = req.modelOrFail('event');
    const {
      body: { dutyId, rotationUnit, date, slot, registrationIds },
    } = await req.validate(validator.store);

    await this.assertDutyBelongsToEvent(event.id, dutyId);
    if (registrationIds !== undefined) {
      await this.assertRegistrationsBelongToEvent(event.id, registrationIds);
    }

    const assignment = await this.dutyAssignmentService.createDutyAssignment(
      event.id,
      { dutyId, rotationUnit, date, slot, registrationIds },
    );

    void this.realtimeService.emit(
      event.id,
      'dutyAssignment',
      assignment.id,
      'created',
    );

    res
      .status(httpStatus.CREATED)
      .resource(new DutyAssignmentResource(assignment));
  }

  async update(req: Request, res: Response) {
    const event = req.modelOrFail('event');
    const existingAssignment = req.modelOrFail('dutyAssignment');
    const {
      body: { dutyId, rotationUnit, date, slot, registrationIds },
    } = await req.validate(validator.update);

    if (dutyId !== undefined) {
      await this.assertDutyBelongsToEvent(event.id, dutyId);
    }
    if (registrationIds !== undefined) {
      await this.assertRegistrationsBelongToEvent(event.id, registrationIds);
    }

    const assignment =
      await this.dutyAssignmentService.updateDutyAssignmentById(
        existingAssignment.id,
        { dutyId, rotationUnit, date, slot, registrationIds },
      );

    void this.realtimeService.emit(
      event.id,
      'dutyAssignment',
      assignment.id,
      'updated',
    );

    res.resource(new DutyAssignmentResource(assignment));
  }

  async destroy(req: Request, res: Response) {
    const event = req.modelOrFail('event');
    const assignment = req.modelOrFail('dutyAssignment');
    await req.validate(validator.destroy);

    await this.dutyAssignmentService.deleteDutyAssignmentById(assignment.id);

    void this.realtimeService.emit(
      event.id,
      'dutyAssignment',
      assignment.id,
      'deleted',
    );

    res.status(httpStatus.NO_CONTENT).send();
  }

  private async assertDutyBelongsToEvent(eventId: string, dutyId: string) {
    const duty = await this.dutyService.getDutyById(eventId, dutyId);

    if (duty === null) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid duty id');
    }
  }

  private async assertRegistrationsBelongToEvent(
    eventId: string,
    registrationIds: string[],
  ) {
    const unique = [...new Set(registrationIds)];
    const registrations = await this.registrationService.getRegistrationsByIds(
      eventId,
      unique,
    );

    if (registrations.length !== unique.length) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid registration id');
    }
  }
}
