import httpStatus from 'http-status';
import ApiError from '#utils/ApiError';
import { ChoreAssignmentService } from './chore-assignment.service.js';
import { ChoreAssignmentResource } from './chore-assignment.resource.js';
import validator from './chore-assignment.validation.js';
import { type Request, type Response } from 'express';
import { BaseController } from '#core/base/BaseController';
import { RealtimeService } from '#core/realtime/RealtimeService';
import { ChoreService } from '#app/chore/chore.service';
import { RegistrationService } from '#app/registration/registration.service';
import type { ChoreWithSlots } from '#app/chore-assignment/chore-assignment.types';
import type { ChoreAssignmentMemberData } from '@camp-registration/common/entities';
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
      query: { choreId, unit, role, date, assignmentId },
    } = await req.validate(validator.suggestions);

    const chore = await this.choreService.getChoreById(event.id, choreId);
    if (!chore) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Chore not found');
    }

    const suggestions = await this.choreAssignmentService.getSuggestions(
      event.id,
      chore,
      { unit, role, date, assignmentId },
    );

    res.json({ data: suggestions, meta: {} });
  }

  async fairness(req: Request, res: Response) {
    const event = req.modelOrFail('event');
    await req.validate(validator.fairness);

    const entries = await this.choreAssignmentService.getFairness(event.id);

    res.json({ data: entries, meta: {} });
  }

  async preview(req: Request, res: Response) {
    const event = req.modelOrFail('event');
    const chore = req.modelOrFail('chore');
    const { body } = await req.validate(validator.preview);

    this.assertSlotBelongsToChore(chore, body.slotId);
    await this.assertMembersBelongToEvent(event.id, body.members);

    const members = await this.choreAssignmentService.previewMembers(
      event.id,
      chore,
      body,
    );

    res.json({ data: members, meta: {} });
  }

  async store(req: Request, res: Response) {
    const event = req.modelOrFail('event');
    const chore = req.modelOrFail('chore');
    const { body } = await req.validate(validator.store);

    this.assertSlotBelongsToChore(chore, body.slotId);
    await this.assertMembersBelongToEvent(event.id, body.members);

    const assignment = await this.choreAssignmentService.createChoreAssignment(
      event.id,
      chore,
      body,
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

  async series(req: Request, res: Response) {
    const event = req.modelOrFail('event');
    const chore = req.modelOrFail('chore');
    const { body } = await req.validate(validator.series);

    for (const slotId of body.slotIds) {
      this.assertSlotBelongsToChore(chore, slotId);
    }

    const result = await this.choreAssignmentService.planSeries(
      event.id,
      chore,
      body,
    );

    void this.realtimeService.emitInvalidation(event.id, 'choreAssignment');

    res.status(httpStatus.CREATED).json({ data: result, meta: {} });
  }

  async destroyMany(req: Request, res: Response) {
    const event = req.modelOrFail('event');
    const { query } = await req.validate(validator.destroyMany);

    const count = await this.choreAssignmentService.deleteChoreAssignments(
      event.id,
      query,
    );

    void this.realtimeService.emitInvalidation(event.id, 'choreAssignment');

    res.json({ data: { count }, meta: {} });
  }

  async removePerson(req: Request, res: Response) {
    const event = req.modelOrFail('event');
    const { body } = await req.validate(validator.removePerson);

    await this.assertMembersBelongToEvent(event.id, [
      { registrationId: body.registrationId },
    ]);

    const result = await this.choreAssignmentService.removePerson(
      event.id,
      body,
    );

    void this.realtimeService.emitInvalidation(event.id, 'choreAssignment');

    res.json({ data: result, meta: {} });
  }

  async update(req: Request, res: Response) {
    const event = req.modelOrFail('event');
    const existingAssignment = req.modelOrFail('choreAssignment');
    const { body } = await req.validate(validator.update);

    const choreId = body.choreId ?? existingAssignment.choreId;
    const chore = await this.choreService.getChoreById(event.id, choreId);
    if (chore === null) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid chore id');
    }
    // A new chore without a new slot can't keep the old chore's slot.
    const slotId =
      body.slotId !== undefined
        ? body.slotId
        : body.choreId !== undefined &&
            body.choreId !== existingAssignment.choreId
          ? null
          : undefined;
    this.assertSlotBelongsToChore(chore, slotId);
    await this.assertMembersBelongToEvent(event.id, body.members);

    const assignment =
      await this.choreAssignmentService.updateChoreAssignmentById(
        existingAssignment.id,
        { ...body, slotId },
      );

    void this.realtimeService.emit(
      event.id,
      'choreAssignment',
      assignment.id,
      'updated',
    );

    res.resource(new ChoreAssignmentResource(assignment));
  }

  async fill(req: Request, res: Response) {
    const event = req.modelOrFail('event');
    const existingAssignment = req.modelOrFail('choreAssignment');
    await req.validate(validator.fill);

    const assignment = await this.choreAssignmentService.fillChoreAssignment(
      event.id,
      existingAssignment.id,
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

  private assertSlotBelongsToChore(
    chore: ChoreWithSlots,
    slotId: string | null | undefined,
  ) {
    if (slotId && !chore.slots.some((slot) => slot.id === slotId)) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid slot id');
    }
  }

  private async assertMembersBelongToEvent(
    eventId: string,
    members: ChoreAssignmentMemberData[] | undefined,
  ) {
    if (!members?.length) {
      return;
    }

    const unique = [...new Set(members.map((m) => m.registrationId))];
    const registrations = await this.registrationService.getRegistrationsByIds(
      eventId,
      unique,
    );

    if (registrations.length !== unique.length) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid registration id');
    }
  }
}
