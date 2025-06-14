import express from 'express';
import type {
  User as UserModel,
  Camp,
  Registration,
  TableTemplate,
  Message,
  MessageTemplate,
  CampManager,
  Bed,
  Room,
  File,
  Expense,
} from '@prisma/client';
import type { AnyZodObject, z } from 'zod';
import type { JsonResource } from '#core/resource/JsonResource';

declare global {
  namespace Express {
    interface Models {
      user?: UserModel;
      camp?: Camp & { freePlaces: number | Record<string, number> };
      registration?: Registration;
      tableTemplate?: TableTemplate;
      message?: Message & { attachments: File[] };
      messageTemplate?: MessageTemplate & { attachments: File[] };
      manager?: CampManager;
      room?: Room & { beds: Bed[] };
      bed?: Bed;
      file?: File;
      expense?: Expense & { file: File | null };
    }

    interface AuthUser {
      id: string;
      role: string;
    }

    interface Request {
      user?: AuthUser;
      models: Models;

      // Validation
      validate: <T extends AnyZodObject>(
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
