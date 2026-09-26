import type { RequestHandler } from 'express';
import { bindModelFromBody } from '#core/router/router';
import { resolve } from '#core/ioc/container';
import { OrganizationService } from '#app/organization/organization.service';

/**
 * Binds the organization named by `organizationId` in the request body, for the
 * routes that take it there rather than in the path. Place it before the route
 * guard: `organizationMember()` reads the bound model, and the controller gets
 * the organization without a lookup of its own.
 */
export const organizationFromBody = (): RequestHandler =>
  bindModelFromBody('organization', 'organizationId', (_req, id) =>
    resolve(OrganizationService).getOrganizationById(id),
  );
