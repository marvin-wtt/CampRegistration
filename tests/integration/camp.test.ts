import { beforeEach, describe, expect, expectTypeOf, it } from "vitest";
import prisma from "../utils/prisma";
import { generateAccessToken } from "../utils/token";
import request from "supertest";
import app from "../../src/app";
import { CampFactory, UserFactory } from "../../prisma/factories";
import {Camp, Prisma, User} from "@prisma/client";
import moment from "moment";

// test.todo("Camp manager invitation");

export interface CampTestContext {
  user: User;
  otherUser: User;
  accessToken: string;
  otherAccessToken: string;
  publicCamp: Camp;
  privateCamp: Camp;
}

const assertCampModel = async (id: string, data: Prisma.CampCreateInput) => {
  const camp = await prisma.camp.findFirst({
    where: {
      id: id
    }
  }) as Camp;
  expect(camp.countries).toEqual(data.countries);
  expect(camp.public).toEqual(data.public);
  expect(camp.name).toEqual(data.name);
  expect(camp.maxParticipants).toEqual(
    data.maxParticipants
  );
  expect(camp.minAge).toEqual(data.minAge);
  expect(camp.maxAge).toEqual(data.maxAge);
  expect(camp.startAt.toISOString()).toEqual(data.startAt);
  expect(camp.endAt.toISOString()).toEqual(data.endAt);
  expect(camp.price).toEqual(data.price);
  expect(camp.location).toEqual(data.location);
  expect(camp.form).toEqual(data.form);
}

const assertCampResponse = (body: object, data: Prisma.CampCreateInput) => {
  expect(body).toHaveProperty("data.id");
  expect(body).toHaveProperty("data.public", false);
  expect(body).toHaveProperty("data.countries", data.countries);
  expect(body).toHaveProperty("data.name", data.name);
  expect(body).toHaveProperty(
    "data.max_participants",
    data.maxParticipants
  );
  expect(body).toHaveProperty("data.min_age", data.minAge);
  expect(body).toHaveProperty("data.max_age", data.maxAge);
  expect(body).toHaveProperty("data.start_at", data.startAt);
  expect(body).toHaveProperty("data.end_at", data.endAt);
  expect(body).toHaveProperty("data.price", data.price);
  expect(body).toHaveProperty("data.location", data.location);
  expect(body).toHaveProperty("data.form", data.form);
}

describe("/api/v1/camps", () => {
  beforeEach<CampTestContext>(async (context) => {
    context.user = await UserFactory.create();
    context.otherUser = await UserFactory.create();
    context.publicCamp = await CampFactory.create({
      public: true,
      campManager: {
        create: {
          userId: context.user.id,
        },
      },
    });
    context.privateCamp = await CampFactory.create({
      public: false,
      campManager: {
        create: {
          userId: context.user.id,
        },
      },
    });

    context.accessToken = generateAccessToken(context.user);
    context.otherAccessToken = generateAccessToken(context.otherUser);
  });

  describe("GET /api/v1/camps", () => {
    it<CampTestContext>("should respond with `200` status code", async () => {
      const { status, body } = await request(app).get(`/api/v1/camps/`).send();

      expect(status).toBe(200);
      expect(body).toHaveProperty("data");
      expectTypeOf(body.data).toBeArray();
    });

    it<CampTestContext>("should show all public camps", async () => {
      const { body } = await request(app).get(`/api/v1/camps/`).send();

      expect(body.data.length).toBe(1);
      // TODO Test properties
    });

    it.todo("should not show private camps to unauthenticated users");

    it.todo("should not show private camps to users");
  });

  describe("GET /api/v1/camps/:campId", () => {
    it<CampTestContext>("should respond with `200` status code when camp is public", async (context) => {
      const { status, body } = await request(app)
        .get(`/api/v1/camps/${context.publicCamp.id}`)
        .send();

      expect(status).toBe(200);
      expect(body).toHaveProperty("data.id", context.publicCamp.id);
      expect(body).toHaveProperty("data.public", context.publicCamp.public);
      expect(body).toHaveProperty(
        "data.countries",
        context.publicCamp.countries
      );
      expect(body).toHaveProperty("data.name", context.publicCamp.name);
      expect(body).toHaveProperty(
        "data.max_participants",
        context.publicCamp.maxParticipants
      );
      expect(body).toHaveProperty("data.min_age", context.publicCamp.minAge);
      expect(body).toHaveProperty("data.max_age", context.publicCamp.maxAge);
      expect(body).toHaveProperty(
        "data.start_at",
        context.publicCamp.startAt.toISOString()
      );
      expect(body).toHaveProperty(
        "data.end_at",
        context.publicCamp.endAt.toISOString()
      );
      expect(body).toHaveProperty("data.price", context.publicCamp.price);
      expect(body).toHaveProperty("data.location", context.publicCamp.location);
      expect(body).toHaveProperty("data.form", context.publicCamp.form);
    });

    it<CampTestContext>("should respond with `200` status code when camp is private and user is camp manager", async (context) => {
      const { status } = await request(app)
        .get(`/api/v1/camps/${context.privateCamp.id}`)
        .send()
        .set("Authorization", `Bearer ${context.accessToken}`);

      expect(status).toBe(200);
    });

    it<CampTestContext>("should respond with `401` status code when camp is private", async (context) => {
      const { status } = await request(app)
        .get(`/api/v1/camps/${context.privateCamp.id}`)
        .send();

      expect(status).toBe(401);
    });

    it<CampTestContext>("should respond with `403` status code when camp is private and user is not a manager", async (context) => {
      const { status } = await request(app)
        .get(`/api/v1/camps/${context.privateCamp.id}`)
        .send()
        .set("Authorization", `Bearer ${context.otherAccessToken}`);

      expect(status).toBe(403);
    });

    it.todo(
      "should respond with `400` status code when query parameters are invalid"
    );
  });

  describe("POST /api/v1/camps", () => {
    it<CampTestContext>("should respond with `201` status code when user is authenticated", async (context) => {
      const data = {
        public: false,
        countries: ["de"],
        name: { de: "Test Camp" },
        maxParticipants: { de: 10 },
        minAge: 10,
        maxAge: 15,
        startAt: moment().add("20 days").startOf("hour").toDate().toISOString(),
        endAt: moment().add("22 days").startOf("hour").toDate().toISOString(),
        price: 100.0,
        location: { de: "Somewhere" },
        form: {},
      };

      const { status, body } = await request(app)
        .post(`/api/v1/camps/`)
        .send(data)
        .set("Authorization", `Bearer ${context.otherAccessToken}`);

      expect(status).toBe(201);

      // Test response
      assertCampResponse(body, data);

      // Test model
      const campCount = await prisma.camp.count();
      expect(campCount).toBe(3);

      await assertCampModel(body.data.id, data);
    });

    it<CampTestContext>("should respond with `401` status code when unauthenticated", async () => {
      const { status } = await request(app).post(`/api/v1/camps/`).send();

      expect(status).toBe(401);
    });

    it<CampTestContext>("should respond with `400` status code when body is invalid", async (context) => {
      // TODO Test all fields

      const { status } = await request(app)
        .post(`/api/v1/camps/`)
        .send()
        .set("Authorization", `Bearer ${context.otherAccessToken}`);

      expect(status).toBe(400);
    });
  });

  describe("PATCH /api/v1/camps/:campId", () => {
    it<CampTestContext>("should respond with `200` status code when user is camp manager", async (context)  => {
      const data = {
        public: false,
        countries: ["de"],
        name: { de: "Test Camp" },
        maxParticipants: { de: 10 },
        minAge: 10,
        maxAge: 15,
        startAt: moment().add("20 days").startOf("hour").toDate().toISOString(),
        endAt: moment().add("22 days").startOf("hour").toDate().toISOString(),
        price: 100.0,
        location: { de: "Somewhere" },
        form: {},
      };

      const { status, body } = await request(app)
        .patch(`/api/v1/camps/${context.publicCamp.id}`)
        .send(data)
        .set("Authorization", `Bearer ${context.accessToken}`);

      expect(status).toBe(200);

      // Test response
      assertCampResponse(body, data);

      // Test model
      await assertCampModel(body.data.id, data);
    });

    it<CampTestContext>("should respond with `403` status code when user is not camp manager", async (context) => {
      const { status } = await request(app)
        .patch(`/api/v1/camps/${context.privateCamp.id}`)
        .send()
        .set("Authorization", `Bearer ${context.otherAccessToken}`);

      expect(status).toBe(403);
    });

    it<CampTestContext>("should respond with `401` status code when unauthenticated", async (context) => {
      const { status } = await request(app)
        .patch(`/api/v1/camps/${context.privateCamp.id}`)
        .send();

      expect(status).toBe(401);
    });

    it<CampTestContext>("should respond with `400` status code when body is invalid", async (context) => {
      // TODO Test all fields

      const { status } = await request(app)
        .patch(`/api/v1/camps/${context.privateCamp.id}`)
        .send()
        .set("Authorization", `Bearer ${context.otherAccessToken}`);

      expect(status).toBe(403);
    });
  });

  describe("DELETE /api/v1/camps/:campId", () => {
    it<CampTestContext>("should respond with `204` status code when user is camp manager", async (context) => {
      const { status } = await request(app)
        .delete(`/api/v1/camps/${context.publicCamp.id}`)
        .send()
        .set("Authorization", `Bearer ${context.accessToken}`);

      const campCount = await prisma.camp.count();

      expect(status).toBe(204);
      expect(campCount).toBe(1);
    });

    it<CampTestContext>("should respond with `403` status code when user is not camp manager", async (context) => {
      const { status } = await request(app)
        .delete(`/api/v1/camps/${context.publicCamp.id}`)
        .send()
        .set("Authorization", `Bearer ${context.otherAccessToken}`);

      const campCount = await prisma.camp.count();

      expect(status).toBe(403);
      expect(campCount).toBe(2);
    });

    it<CampTestContext>("should respond with `401` status code when unauthenticated", async (context) => {
      const { status } = await request(app)
        .delete(`/api/v1/camps/${context.publicCamp.id}`)
        .send();

      const campCount = await prisma.camp.count();

      expect(status).toBe(401);
      expect(campCount).toBe(2);
    });
  });
});
