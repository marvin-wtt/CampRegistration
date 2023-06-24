declare global {
  declare module "express-serve-static-core" {
    import { Camp, Registration, Template, User } from "@prisma/client";

    interface Request {
      models: {
        user: User;
        camp: Camp;
        registration: Registration;
        template: Template;
      };
    }
  }
}
