import { beforeEach, describe, expect, it } from "vitest";
import prisma from "../utils/prisma";
import { generateAccessToken } from "../utils/token";
import request from "supertest";
import app from "../../src/app";
import {CampFactory, UserFactory} from "../../prisma/factories";
import {Camp, Registration, User} from "@prisma/client";

export interface RegistrationTestContext {
  user: User;
  otherUser: User;
  accessToken: string;
  otherAccessToken: string;
  camp: Camp;
  registration: Registration;
}

describe("/api/v1/camps/:campId/registrations", () => {
  beforeEach<RegistrationTestContext>(async (context) => {
    context.user = await UserFactory.create();
    context.otherUser = await UserFactory.create();
    context.camp = await CampFactory.create();

    context.accessToken = generateAccessToken(context.user);
    context.otherAccessToken = generateAccessToken(context.otherUser);
  });

  describe("GET /api/v1/camps/:campId/registrations/", () => {
    it.todo("should respond with `200` status code when user is camp manager");

    it.todo("should show all registrations of a camp");

    it.todo(
      "should respond with `403` status code when user is not camp manager"
    );

    it.todo("should respond with `401` status code when unauthenticated");

    it.todo(
      "should respond with `400` status code when query parameters are invalid"
    );
  });

  describe("GET /api/v1/camps/:campId/registrations/:registrationId", () => {
    it.todo("should respond with `200` status code when user is camp manager");

    it.todo(
      "should respond with `403` status code when user is not camp manager"
    );

    it.todo("should respond with `401` status code when unauthenticated");

    it.todo(
      "should respond with `400` status code when query parameters are invalid"
    );
  });

  describe("POST /api/v1/camps/:campId/registrations/", () => {
    it.todo("should respond with `201` status code");

    it.todo("should respond with `400` status code when the survey is invalid");
  });

  describe("PUT /api/v1/camps/:campId/registrations/:registrationId", () => {
    it.todo("should respond with `200` status code when user is camp manager");

    it.todo("should upload files if attached");

    it.todo(
      "should respond with `403` status code when user is not camp manager"
    );

    it.todo("should respond with `401` status code when unauthenticated");

    it.todo("should respond with `400` status code when request body is empty");
  });

  describe("DELETE /api/v1/camps/:campId/registrations/:registrationId", () => {
    it<RegistrationTestContext>("should respond with `204` status code when user is camp manager", async (context) => {
      const { status } = await request(app)
        .delete(
          `/api/v1/camps/${context.camp.id}/registrations/${context.registration.id}`
        )
        .send()
        .set("Authorization", `Bearer ${context.accessToken}`);

      const registrationCount = await prisma.registration.count();

      expect(status).toBe(204);
      expect(registrationCount).toBe(0);
    });

    it<RegistrationTestContext>("should respond with `403` status code when user is not camp manager", async (context) => {
      const { status } = await request(app)
        .delete(
          `/api/v1/camps/${context.camp.id}/registrations/${context.registration.id}`
        )
        .send()
        .set("Authorization", `Bearer ${context.otherAccessToken}`);

      const registrationCount = await prisma.registration.count();

      expect(status).toBe(204);
      expect(registrationCount).toBe(1);
    });

    it.todo(
      "should respond with `403` status code when user is camp manager of another camp"
    );

    it<RegistrationTestContext>("should respond with `401` status code when unauthenticated", async (context) => {
      const { status } = await request(app)
        .delete(
          `/api/v1/camps/${context.camp.id}/registrations/${context.registration.id}`
        )
        .send();

      const registrationCount = await prisma.registration.count();

      expect(status).toBe(204);
      expect(registrationCount).toBe(1);
    });

    it.todo("should delete all files related to the registration");
  });
});
