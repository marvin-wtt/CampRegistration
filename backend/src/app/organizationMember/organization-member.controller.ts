import httpStatus from 'http-status';
import ApiError from '#utils/ApiError';
import { type Request, type Response } from 'express';
import { BaseController } from '#core/base/BaseController';
import { inject, injectable } from 'inversify';
import { UserService } from '#app/user/user.service';
import { OrganizationMemberService } from './organization-member.service.js';
import { OrganizationMemberResource } from './organization-member.resource.js';
import validator from './organization-member.validation.js';

@injectable()
export class OrganizationMemberController extends BaseController {
  constructor(
    @inject(OrganizationMemberService)
    private readonly memberService: OrganizationMemberService,
    @inject(UserService) private readonly userService: UserService,
  ) {
    super();
  }

  async index(req: Request, res: Response) {
    const organization = req.modelOrFail('organization');
    await req.validate(validator.index);

    const members = await this.memberService.getMembers(organization.id);

    res.resource(OrganizationMemberResource.collection(members));
  }

  async store(req: Request, res: Response) {
    const organization = req.modelOrFail('organization');
    const {
      body: { email, role },
    } = await req.validate(validator.store);

    const existing = await this.memberService.getMemberByEmail(
      organization.id,
      email,
    );
    if (existing) {
      throw new ApiError(
        httpStatus.CONFLICT,
        'This person is already a member of the organization.',
      );
    }

    const user = await this.userService.getUserByEmail(email);

    // Someone without an account yet is invited by email and bound to the
    // membership when they register.
    const member =
      user === null
        ? await this.memberService.inviteMember(organization.id, email, role)
        : await this.memberService.addMember(organization.id, user.id, role);

    res
      .status(httpStatus.CREATED)
      .resource(new OrganizationMemberResource(member));
  }

  async update(req: Request, res: Response) {
    const organization = req.modelOrFail('organization');
    const member = req.modelOrFail('organizationMember');
    const {
      body: { role },
    } = await req.validate(validator.update);

    if (member.role === 'ADMIN' && role !== 'ADMIN') {
      await this.checkAdminConstraints(organization.id, member.id);
    }

    const updated = await this.memberService.updateMemberById(member.id, role);

    res.resource(new OrganizationMemberResource(updated));
  }

  async destroy(req: Request, res: Response) {
    const organization = req.modelOrFail('organization');
    const member = req.modelOrFail('organizationMember');
    await req.validate(validator.destroy);

    if (member.role === 'ADMIN') {
      await this.checkAdminConstraints(organization.id, member.id);
    }

    await this.memberService.removeMember(member.id);

    res.sendStatus(httpStatus.NO_CONTENT);
  }

  /**
   * An organization must never lose its last administrator — there would be
   * nobody able to manage its members, camps or verification, and no way back
   * in short of a system administrator.
   */
  private async checkAdminConstraints(
    organizationId: string,
    memberId: string,
  ) {
    const hasOtherAdmin = await this.memberService.hasOtherAdmin(
      organizationId,
      memberId,
    );

    if (!hasOtherAdmin) {
      throw new ApiError(
        httpStatus.CONFLICT,
        'The organization must always have at least one administrator.',
      );
    }
  }
}
