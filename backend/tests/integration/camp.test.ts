import { beforeEach, describe, expect, expectTypeOf, it } from "vitest";
import prisma from "../utils/prisma";
import { generateAccessToken } from "../utils/token";
import request from "supertest";
import app from "../../src/app";
import { CampFactory, UserFactory } from "../../prisma/factories";
import { Camp, Prisma, User } from "@prisma/client";
import moment from "moment";
import { ulid } from "ulidx";

// test.todo("Camp manager invitation");

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export interface CampTestContext {
  user: User;
  otherUser: User;
  accessToken: string;
  otherAccessToken: string;
  publicCamp: Camp;
  privateCamp: Camp;
  inactiveCamp: Camp;
}

const assertCampModel = async (
  id: string,
  data: PartialBy<Prisma.CampCreateInput, "id">,
) => {
  const camp = (await prisma.camp.findFirst({
    where: {
      id: id,
    },
  })) as Camp;
  expect(camp).not.toBeNull();

  expect(camp).toEqual({
    id: data.id ?? expect.anything(),
    active: data.active,
    public: data.public,
    countries: data.countries,
    name: data.name,
    organization: data.organization,
    maxParticipants: data.maxParticipants,
    minAge: data.minAge,
    maxAge: data.maxAge,
    startAt: new Date(data.startAt),
    endAt: new Date(data.endAt),
    price: data.price,
    location: data.location,
    form: data.form,
    themes: data.themes,
    updatedAt: expect.anything(),
    createdAt: expect.anything(),
  });
};

// const assertDetailedResponseBody = (
//   body: any,
//   data: PartialBy<Prisma.CampCreateInput, "id">,
// ) => {
//   assertCampResponseBody(body, data);
//
// };

const assertCampResponseBody = (
  body: any,
  data: PartialBy<Prisma.CampCreateInput, "id">,
) => {
  expect(body).toHaveProperty("data");
  expect(body.data).toEqual({
    id: data.id ?? expect.anything(),
    active: data.active,
    public: data.public,
    countries: data.countries,
    name: data.name,
    organization: data.organization,
    maxParticipants: data.maxParticipants,
    minAge: data.minAge,
    maxAge: data.maxAge,
    startAt: data.startAt,
    endAt: data.endAt,
    price: data.price,
    location: data.location,
    form: data.form,
    themes: data.themes,
  });
};

describe("/api/v1/camps", () => {
  beforeEach<CampTestContext>(async (context) => {
    context.user = await UserFactory.create();
    context.otherUser = await UserFactory.create();
    context.publicCamp = await CampFactory.create({
      public: true,
      active: true,
      campManager: {
        create: {
          id: ulid(),
          userId: context.user.id,
        },
      },
    });
    context.privateCamp = await CampFactory.create({
      public: false,
      active: true,
      campManager: {
        create: {
          id: ulid(),
          userId: context.user.id,
        },
      },
    });
    context.inactiveCamp = await CampFactory.create({
      public: true,
      active: false,
      campManager: {
        create: {
          id: ulid(),
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

    it<CampTestContext>("should only include active camps", async () => {
      const { body } = await request(app).get(`/api/v1/camps/`).send();

      expect(body.data.length).toBe(1);
      // TODO Test properties
    });
  });

  describe("GET /api/v1/camps/:campId", () => {
    it<CampTestContext>("should respond with `200` status code when camp is public", async (context) => {
      const camp = context.publicCamp;
      const { status, body } = await request(app)
        .get(`/api/v1/camps/${context.publicCamp.id}`)
        .send();

      expect(status).toBe(200);
      expect(body).toHaveProperty("data");
      // TODO Use common assertion method
      expect(body.data).toEqual({
        id: camp.id,
        active: camp.active,
        public: camp.public,
        countries: camp.countries,
        name: camp.name,
        organization: camp.organization,
        maxParticipants: camp.maxParticipants,
        minAge: camp.minAge,
        maxAge: camp.maxAge,
        startAt: camp.startAt.toISOString(),
        endAt: camp.endAt.toISOString(),
        price: camp.price,
        location: camp.location,
        form: camp.form,
        themes: camp.themes,
        freePlaces: expect.anything(),
      });
    });

    it<CampTestContext>("should respond with `200` status code when camp is private", async (context) => {
      const { status } = await request(app)
        .get(`/api/v1/camps/${context.privateCamp.id}`)
        .send();

      expect(status).toBe(200);
    });

    it<CampTestContext>("should respond with `200` status code when camp is not active and user is camp manager", async (context) => {
      const { status } = await request(app)
        .get(`/api/v1/camps/${context.inactiveCamp.id}`)
        .send()
        .set("Authorization", `Bearer ${context.accessToken}`);

      expect(status).toBe(200);
    });

    it<CampTestContext>("should respond with `401` status code when camp is not active", async (context) => {
      const { status } = await request(app)
        .get(`/api/v1/camps/${context.inactiveCamp.id}`)
        .send();

      expect(status).toBe(401);
    });

    it<CampTestContext>("should respond with `403` status code when camp is not active and user is not a manager", async (context) => {
      const { status } = await request(app)
        .get(`/api/v1/camps/${context.inactiveCamp.id}`)
        .send()
        .set("Authorization", `Bearer ${context.otherAccessToken}`);

      expect(status).toBe(403);
    });

    it<CampTestContext>("should respond with `404` status code when camp id does not exists", async (context) => {
      const id = "01H9XKPT4NRJB6F7Z0CDV8DCB";
      const { status } = await request(app)
        .get(`/api/v1/camps/${id}`)
        .send()
        .set("Authorization", `Bearer ${context.accessToken}`);

      expect(status).toBe(404);
    });
  });

  describe("POST /api/v1/camps", () => {
    it<CampTestContext>("should respond with `201` status code when user is authenticated", async (context) => {
      const data = {
        public: false,
        countries: ["de"],
        name: "Test Camp",
        organization: "Test Org",
        maxParticipants: 10,
        minAge: 10,
        maxAge: 15,
        startAt: moment().add("20 days").startOf("hour").toDate().toISOString(),
        endAt: moment().add("22 days").startOf("hour").toDate().toISOString(),
        price: 100.0,
        location: "Somewhere",
        form: {},
        themes: {},
      };

      const { status, body } = await request(app)
        .post(`/api/v1/camps/`)
        .send(data)
        .set("Authorization", `Bearer ${context.otherAccessToken}`);

      expect(status).toBe(201);

      const expectedData = {
        ...data,
        active: false,
      };

      // Test response
      assertCampResponseBody(body, expectedData);

      // Test model
      const campCount = await prisma.camp.count();
      expect(campCount).toBe(4);

      await assertCampModel(body.data.id, expectedData);
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
    it<CampTestContext>("should respond with `200` status code when user is camp manager", async (context) => {
      const data = {
        active: true,
        public: false,
        countries: ["de"],
        name: "Test Camp",
        organization: "Test Org",
        maxParticipants: 10,
        minAge: 10,
        maxAge: 15,
        startAt: moment().add("20 days").startOf("hour").toDate().toISOString(),
        endAt: moment().add("22 days").startOf("hour").toDate().toISOString(),
        price: 100.0,
        location: "Somewhere",
        form: {},
        themes: {},
      };

      const id = context.publicCamp.id;
      const { status, body } = await request(app)
        .patch(`/api/v1/camps/${id}`)
        .send(data)
        .set("Authorization", `Bearer ${context.accessToken}`);

      expect(status).toBe(200);

      // Test response
      assertCampResponseBody(body, data);

      // Test model
      await assertCampModel(id, data);
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

    it<CampTestContext>("should respond with `404` status code when camp id does not exists", async (context) => {
      const id = "01H9XKPT4NRJB6F7Z0CDV8DCB";
      const data = {
        public: true,
      };
      const { status } = await request(app)
        .patch(`/api/v1/camps/${id}`)
        .send(data)
        .set("Authorization", `Bearer ${context.accessToken}`);

      expect(status).toBe(404);
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
      expect(campCount).toBe(2);
    });

    it<CampTestContext>("should respond with `403` status code when user is not camp manager", async (context) => {
      const { status } = await request(app)
        .delete(`/api/v1/camps/${context.publicCamp.id}`)
        .send()
        .set("Authorization", `Bearer ${context.otherAccessToken}`);

      const campCount = await prisma.camp.count();

      expect(status).toBe(403);
      expect(campCount).toBe(3);
    });

    it<CampTestContext>("should respond with `401` status code when unauthenticated", async (context) => {
      const { status } = await request(app)
        .delete(`/api/v1/camps/${context.publicCamp.id}`)
        .send();

      const campCount = await prisma.camp.count();

      expect(status).toBe(401);
      expect(campCount).toBe(3);
    });

    it<CampTestContext>("should respond with `404` status code when camp id does not exists", async (context) => {
      const id = "01H9XKPT4NRJB6F7Z0CDV8DCB";
      const { status } = await request(app)
        .delete(`/api/v1/camps/${id}`)
        .send()
        .set("Authorization", `Bearer ${context.accessToken}`);

      expect(status).toBe(404);
    });
  });
});
