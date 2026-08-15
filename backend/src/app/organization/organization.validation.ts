import { z, type ZodType } from 'zod';
import type {
  OrganizationCreateData,
  OrganizationUpdateData,
  OrganizationQuery,
  OrganizationReviewData,
} from '@camp-registration/common/entities';

const index = z.object({
  query: z
    .object({
      view: z.enum(['all', 'assigned']),
      name: z.string(),
      status: z.enum(['PENDING', 'VERIFIED', 'REJECTED']),
      cursor: z.ulid(),
      limit: z.coerce.number().int().positive().max(100),
      sortBy: z.enum([
        'name',
        'createdAt',
        'submittedAt',
        'verificationStatus',
      ]),
      sortType: z.enum(['asc', 'desc']),
    })
    .partial()
    .optional() satisfies ZodType<OrganizationQuery | undefined>,
});

const show = z.object({
  params: z.object({
    organizationId: z.ulid(),
  }),
});

// The full legal dataset is required up front: an organization is submitted for
// moderation the moment it is created, so there is no state in which it may be
// half-filled.
const organizationBody = {
  name: z.string().min(1).max(255),
  contactEmail: z.email().max(255),
  phone: z.string().max(50).nullable().optional(),
  website: z.url().max(255).nullable().optional(),
  country: z.string().length(2).toLowerCase(),
  addressStreet: z.string().min(1).max(255),
  addressZipCode: z.string().min(1).max(20),
  addressCity: z.string().min(1).max(255),
  registrationNumber: z.string().min(1).max(100),
  verificationNote: z.string().max(5000).nullable().optional(),
};

const store = z.object({
  body: z.object(organizationBody) satisfies ZodType<OrganizationCreateData>,
});

const update = z.object({
  params: z.object({
    organizationId: z.ulid(),
  }),
  body: z
    .object(organizationBody)
    .partial() satisfies ZodType<OrganizationUpdateData>,
});

const destroy = z.object({
  params: z.object({
    organizationId: z.ulid(),
  }),
});

const submitVerification = z.object({
  params: z.object({
    organizationId: z.ulid(),
  }),
});

const camps = z.object({
  params: z.object({
    organizationId: z.ulid(),
  }),
  query: z
    .object({
      cursor: z.ulid(),
      limit: z.coerce.number().int().positive().max(100),
      sortBy: z.enum(['name', 'startAt', 'endAt', 'createdAt']),
      sortType: z.enum(['asc', 'desc']),
    })
    .partial(),
});

const review = z.object({
  params: z.object({
    organizationId: z.ulid(),
  }),
  body: z.object({
    status: z.enum(['VERIFIED', 'REJECTED']),
    reviewNote: z.string().max(5000).nullable().optional(),
  }) satisfies ZodType<OrganizationReviewData>,
});

export default {
  index,
  show,
  store,
  update,
  destroy,
  submitVerification,
  review,
  camps,
};
