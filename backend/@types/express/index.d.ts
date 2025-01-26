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

    interface Request {
      user?: AuthUser;
      models: {
        user?: UserModel;
        camp?: Camp;
        registration?: Registration;
        tableTemplate?: TableTemplate;
        messageTemplate?: MessageTemplate;
        manager?: CampManager;
        room?: Room & { beds: Bed[] };
        bed?: Bed;
        file?: File;
      };

      validate: <T extends AnyZodObject>(
        schema: T,
      ) => Promise<Readonly<z.infer<T>>>;
    }
  }
}
