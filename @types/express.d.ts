declare global {
  import {Camp, CampManager, Registration, Template, User} from "@prisma/client";
  declare module "express-serve-static-core" {
    interface Request {
      models: {
        user?: User;
        camp?: Camp;
        registration?: Registration;
        template?: Template;
        manager?: CampManager;
      };
    }
  }
}
