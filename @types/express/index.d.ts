import express from "express";

declare global {
  namespace Express {
    interface Request {
      models: {
        user?: import("@prisma/client").User;
        camp?: import("@prisma/client").Camp;
        registration?: import("@prisma/client").Registration;
        template?: import("@prisma/client").Template;
        manager?: import("@prisma/client").CampManager;
        room?: import("@prisma/client").Room;
      };
    }
  }
}
