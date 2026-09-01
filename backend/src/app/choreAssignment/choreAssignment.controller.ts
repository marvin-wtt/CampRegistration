import httpStatus from 'http-status';
import ApiError from '#utils/ApiError';
import { ChoreAssignmentService } from './choreAssignment.service.js';
import { ChoreAssignmentResource } from './choreAssignment.resource.js';
import validator from './choreAssignment.validation.js';
import { type Request, type Response } from 'express';
import { BaseController } from '#core/base/BaseController';
import { RealtimeService } from '#core/realtime/RealtimeService';
import { ChoreService } from '#app/chore/chore.service';
import { RegistrationService } from '#app/registration/registration.service';
import { inject, injectable } from 'inversify';

@injectable()
export class ChoreAssignmentController extends BaseController {
  constructor(
    @inject(ChoreAssignmentService)
    private readonly choreAssignmentService: ChoreAssignmentService,
    @inject(ChoreService) private readonly choreService: ChoreService,
    @inject(RegistrationService)
    private readonly registrationService: RegistrationService,
    @inject(RealtimeService)
    private readonly realtimeService: RealtimeService,
  ) {
    super();
  }

  show(req: Request, res: Response) {
    const choreAssignment = req.modelOrFail('choreAssignment');

    res.resource(new ChoreAssignmentResource(choreAssignment));
  }

  async index(req: Request, res: Response) {
    const event = req.modelOrFail('event');
    await req.validate(validator.index);

    const assignments = await this.choreAssignmentService.queryChoreAssignments(
      event.id,
    );

    res.resource(ChoreAssignmentResource.collection(assignments));
  }

  async suggestions(req: Request, res: Response) {
    const event = req.modelOrFail('event');
    const {
      query: { choreId, unit },
    } = await req.validate(validator.suggestions);

    const suggestions = await this.choreAssignmentService.getSuggestions(
      event.id,
      choreId,
      unit,
    );

    if (!suggestions) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Chore not found');
    }

    res.json({ data: suggestions, meta: {} });
  }

  async store(req: Request, res: Response) {
    const event = req.modelOrFail('event');
    const {
      body: { choreId, rotationUnit, date, slot, registrationIds },
    } = await req.validate(validator.store);

    await this.assertChoreBelongsToEvent(event.id, choreId);
    if (registrationIds !== undefined) {
      await this.assertRegistrationsBelongToEvent(event.id, registrationIds);
    }

    const assignment = await this.choreAssignmentService.createChoreAssignment(
      event.id,
      { choreId, rotationUnit, date, slot, registrationIds },
    );

    void this.realtimeService.emit(
      event.id,
      'choreAssignment',
      assignment.id,
      'created',
    );

    res
      .status(httpStatus.CREATED)
      .resource(new ChoreAssignmentResource(assignment));
  }

  async update(req: Request, res: Response) {
    const event = req.modelOrFail('event');
    const existingAssignment = req.modelOrFail('choreAssignment');
    const {
      body: { choreId, rotationUnit, date, slot, registrationIds },
    } = await req.validate(validator.update);

    if (choreId !== undefined) {
      await this.assertChoreBelongsToEvent(event.id, choreId);
    }
    if (registrationIds !== undefined) {
      await this.assertRegistrationsBelongToEvent(event.id, registrationIds);
    }

    const assignment =
      await this.choreAssignmentService.updateChoreAssignmentById(
        existingAssignment.id,
        { choreId, rotationUnit, date, slot, registrationIds },
      );

    void this.realtimeService.emit(
      event.id,
      'choreAssignment',
      assignment.id,
      'updated',
    );

    res.resource(new ChoreAssignmentResource(assignment));
  }

  async destroy(req: Request, res: Response) {
    const event = req.modelOrFail('event');
    const assignment = req.modelOrFail('choreAssignment');
    await req.validate(validator.destroy);

    await this.choreAssignmentService.deleteChoreAssignmentById(assignment.id);

    void this.realtimeService.emit(
      event.id,
      'choreAssignment',
      assignment.id,
      'deleted',
    );

    res.status(httpStatus.NO_CONTENT).send();
  }

  private async assertChoreBelongsToEvent(eventId: string, choreId: string) {
    const chore = await this.choreService.getChoreById(eventId, choreId);

    if (chore === null) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid chore id');
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
