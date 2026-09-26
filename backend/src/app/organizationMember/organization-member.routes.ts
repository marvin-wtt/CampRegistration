import { auth, guard } from '#middlewares/index';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { controller } from '#utils/bindController';
import { resolve } from '#core/ioc/container';
import { or } from '#core/guard';
import {
  organizationMember,
  organizationMemberSelf,
} from '#app/organization/organization.guard';
import { OrganizationMemberController } from './organization-member.controller.js';
import { OrganizationMemberService } from './organization-member.service.js';

export class OrganizationMemberRouter extends ModuleRouter {
  protected registerBindings() {
    const memberService = resolve(OrganizationMemberService);
    this.bindModel('organizationMember', (req, id) => {
      const organization = req.model('organization');
      if (!organization) {
        return null;
      }
      return memberService.getMemberById(organization.id, id);
    });
  }

  protected defineRoutes() {
    const memberController = resolve(OrganizationMemberController);

    this.router.use(auth());

    this.router.get(
      '/',
      guard(organizationMember('organization.members.view')),
      controller(memberController, 'index'),
    );
    this.router.post(
      '/',
      guard(organizationMember('organization.members.create')),
      controller(memberController, 'store'),
    );
    this.router.patch(
      '/:organizationMemberId',
      guard(organizationMember('organization.members.edit')),
      controller(memberController, 'update'),
    );
    // Leaving the organization needs no permission; the last-admin check in the
    // controller still applies.
    this.router.delete(
      '/:organizationMemberId',
      guard(
        or(
          organizationMemberSelf,
          organizationMember('organization.members.delete'),
        ),
      ),
      controller(memberController, 'destroy'),
    );
  }
}
