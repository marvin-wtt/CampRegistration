import express from 'express';
import {
  User as UserModel,
  Camp,
  Registration,
  TableTemplate,
  MessageTemplate,
  CampManager,
  Bed,
  Room,
  File,
} from '@prisma/client';
import { AnyZodObject, z } from 'zod';

declare global {
  namespace Express {
    interface AuthUser {
      id: string;
      role: string;
    }

    interface Models {
      user?: UserModel;
      camp?: Camp;
      registration?: Registration;
      tableTemplate?: TableTemplate;
      messageTemplate?: MessageTemplate;
      manager?: CampManager;
      room?: Room & { beds: Bed[] };
      bed?: Bed;
      file?: File;
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
  }
}
