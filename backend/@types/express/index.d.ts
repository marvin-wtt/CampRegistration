import express from 'express';
import {
  User as UserModel,
  Camp,
  Registration,
  TableTemplate,
  CampManager,
  Bed,
  Room,
  File,
  Expense,
} from '@prisma/client';

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
        manager?: CampManager;
        room?: Room & { beds: Bed[] };
        bed?: Bed;
        file?: File;
        expense?: Expense;
      };
    }
  }
}
