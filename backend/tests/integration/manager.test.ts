import { beforeEach, describe, expect, it, expectTypeOf } from "vitest";
import { Camp, CampManager, User } from "@prisma/client";
import { CampFactory, UserFactory } from "../../prisma/factories";
import { generateAccessToken } from "../utils/token";
import { request } from "../utils/request";
import { CampManagerFactory } from "../../prisma/factories/manager";
import { InvitationFactory } from "../../prisma/factories/invitation";

describe("/api/v1/camps/:campId/managers", () => {
  type ManagerTestContext = {
    camp: Camp;
    manager: CampManager;
    user: User;
    otherUser: User;
    accessToken: string;
    otherAccessToken: string;
  };

  beforeEach<ManagerTestContext>(async (context) => {
    context.user = await UserFactory.create();
    context.otherUser = await UserFactory.create();
    context.camp = await CampFactory.create();
    context.manager = await CampManagerFactory.create({
      camp: {
        connect: {
          id: context.camp.id,
        },
      },
      user: {
        connect: {
          id: context.user.id,
        },
      },
    });
    context.accessToken = generateAccessToken(context.user);
    context.otherAccessToken = generateAccessToken(context.otherUser);
  });

  describe("GET /api/v1/camps/:campId/managers/", () => {
    it<ManagerTestContext>("should respond with `200` status code when user is camp manager and invited user exists", async (context) => {
      const invitation = await InvitationFactory.create();
      await CampManagerFactory.create({
        camp: {
          connect: {
            id: context.camp.id,
          },
        },
        invitation: {
          connect: {
            id: invitation.id,
          },
        },
      });

      const { status, body } = await request()
        .get(`/api/v1/camps/${context.camp.id}/managers`)
        .send()
        .set("Authorization", `Bearer ${context.accessToken}`);

      expect(status).toBe(200);

      expect(body).toHaveProperty("data");
      expectTypeOf(body.data).toBeArray();
      expect(body.data.length).toBe(2);
      expect(body.data[0]).toEqual({
        id: expect.anything(),
        name: context.user.name,
        email: context.user.email,
        status: "accepted",
        role: "manager",
      });
      expect(body.data[0]).toEqual({
        id: expect.anything(),
        name: null,
        email: invitation.email,
        status: "pending",
        role: "manager",
      });
    });

    it.todo(
      "should respond with `200` status code when user is camp manager and invited user does not exists",
    );

    it.todo(
      "should respond with `403` status code when user is not camp manager",
    );

    it.todo("should respond with `401` status code when unauthenticated");
  });

  describe("POST /api/v1/camps/:campId/managers/", () => {
    it.todo(
      "should respond with `201` status code when user is camp manager and invited user is registered",
    );

    it.todo(
      "should respond with `201` status code when user is camp manager and invited user is not registered",
    );

    it.todo(
      "should respond with `400` status code when data is invalid",
      () => {
        // TODO Invalid email address, no email address
      },
    );

    it.todo(
      "should respond with `403` status code when user is not camp manager",
    );

    it.todo("should respond with `401` status code when unauthenticated");
  });

  describe("DELETE /api/v1/camps/:campId/managers/:managerId", () => {
    it.todo("should respond with `204` status code when user is camp manager");

    it.todo(
      "should respond with `403` status code when user is not camp manager",
    );

    it.todo("should respond with `401` status code when unauthenticated");
  });
});
