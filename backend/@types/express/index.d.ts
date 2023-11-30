import express from "express";
import {
  User as UserModel,
  Camp,
  Registration,
  Template,
  CampManager,
  Bed,
  Room,
  File,
} from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user: UserModel | undefined;
      models: {
        user?: UserModel;
        camp?: Camp;
        registration?: Registration;
        template?: Template;
        manager?: CampManager;
        room?: Room & { beds: Bed[] };
        bed?: Bed;
        file?: File;
      };
    }
  }
}
