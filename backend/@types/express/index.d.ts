import express from 'express';
import type {
  User as UserModel,
  Registration,
  TableTemplate,
  Message,
  MessageDelivery,
  MessageTemplate,
  EventManager,
  Invitation,
  Bed,
  Room,
  File,
  NewsletterManager,
  NewsletterSubscriber,
  NewsletterMessage,
  Organization,
  OrganizationMember,
  OrganizationInvitation,
  ProgramItem,
  Chore,
} from '../../src/generated/prisma/client.js';
import type { ZodObject, z } from 'zod';
import type { JsonResource } from '#core/resource/JsonResource';
import type { EventWithFreePlaces } from '#app/event/event.types';
import type { NewsletterWithOrganization } from '#app/newsletter/newsletter.types';
import type { TaskWithAssignee } from '#app/task/task.types';
import type { ChoreAssignmentWithRelations } from '#app/choreAssignment/choreAssignment.types';

declare global {
  namespace Express {
    interface Models {
      user?: UserModel & {
        twoFactor: { confirmedAt: Date | null } | null;
      };
      event?: EventWithFreePlaces;
      registration?: Registration;
      tableTemplate?: TableTemplate;
      message?: Message & { attachments: File[] };
      messageDelivery?: MessageDelivery & { attachments: File[] };
      messageTemplate?: MessageTemplate & { attachments: File[] };
      eventManager?: EventManager & {
        user: UserModel | null;
        invitation: Invitation | null;
      };
      room?: Room & { beds: Bed[] };
      bed?: Bed;
      file?: File;
      organization?: Organization;
      organizationMember?: OrganizationMember & {
        user: UserModel | null;
        invitation: OrganizationInvitation | null;
      };
      newsletter?: NewsletterWithOrganization;
      newsletterManager?: NewsletterManager;
      newsletterMessage?: NewsletterMessage;
      newsletterSubscriber?: NewsletterSubscriber;
      programItem?: ProgramItem;
      task?: TaskWithAssignee;
      chore?: Chore;
      choreAssignment?: ChoreAssignmentWithRelations;
    }

    interface AuthUser {
      id: string;
      role: string;
    }

    interface Request {
      user?: AuthUser;
      models: Models;

      // Validation
      validate: <T extends ZodObject>(
        schema: T,
      ) => Promise<Readonly<z.infer<T>>>;

      // Auth
      authUserId: () => string;

      // i18n
      preferredLocale: () => string;

      // Models
      model: <K extends keyof Models>(name: K) => Models[K];
      modelOrFail: <K extends keyof Models>(name: K) => NonNullable<Models[K]>;
      setModel: <K extends keyof Models>(
        name: K,
        value: NonNullable<Models[K]>,
      ) => void;
      setModelOrFail: <K extends keyof Models>(
        name: K,
        value: Models[K] | null,
      ) => void;
    }

    interface Response {
      resource: <T, O>(resource: JsonResource<T, O>) => Response;
    }
  }
}
