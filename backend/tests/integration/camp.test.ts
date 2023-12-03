import { describe, expect, expectTypeOf, it } from "vitest";
import prisma from "../utils/prisma";
import { generateAccessToken } from "../utils/token";
import { CampFactory, UserFactory } from "../../prisma/factories";
import { Camp, Prisma } from "@prisma/client";
import moment from "moment";
import { ulid } from "ulidx";
import {
  campActivePublic,
  campCreateInternational,
  campCreateInvalidBody,
  campCreateNational,
  campInactive,
} from "../fixtures/camp/camp.fixtures";
import { request } from "../utils/request";
import { CampManagerFactory } from "../../prisma/factories/manager";

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

const assertCampModel = async (
  id: string,
  data: PartialBy<Prisma.CampCreateInput, "id" | "form" | "themes">,
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
    contactEmail: data.contactEmail,
    maxParticipants: data.maxParticipants,
    minAge: data.minAge,
    maxAge: data.maxAge,
    startAt: new Date(data.startAt),
    endAt: new Date(data.endAt),
    price: data.price,
    location: data.location,
    form: data.form ?? expect.anything(),
    themes: data.themes ?? expect.anything(),
    updatedAt: expect.anything(),
    createdAt: expect.anything(),
  });
};

const assertCampResponseBody = (
  data: PartialBy<Prisma.CampCreateInput, "id" | "form" | "themes">,
  body: any,
) => {
  expect(body).toHaveProperty("data");
  expect(body.data).toEqual({
    id: data.id ?? expect.anything(),
    active: data.active,
    public: data.public,
    countries: data.countries,
    name: data.name,
    organization: data.organization,
    contactEmail: data.contactEmail,
    maxParticipants: data.maxParticipants,
    minAge: data.minAge,
    maxAge: data.maxAge,
    startAt: data.startAt,
    endAt: data.endAt,
    price: data.price,
    location: data.location,
    form: data.form ?? expect.anything(),
    themes: data.themes ?? expect.anything(),
  });
};

describe("/api/v1/camps", () => {
  const createCampWithManagerAndToken = async () => {
    const camp = await CampFactory.create();
    const user = await UserFactory.create();
    const manager = await CampManagerFactory.create({
      camp: { connect: { id: camp.id } },
      user: { connect: { id: user.id } },
    });
    const accessToken = generateAccessToken(user);

    return {
      camp,
      user,
      manager,
      accessToken,
    };
  };

  describe("GET /api/v1/camps", () => {
    it("should respond with `200` status code", async () => {
      await CampFactory.create(campActivePublic);

      await request().get(`/api/v1/camps/`).send().expect(200);
    });

    it("should show all public camps", async () => {
      await CampFactory.create(campActivePublic);
      await CampFactory.create(campActivePublic);

      const { body } = await request().get(`/api/v1/camps/`).send().expect(200);

      expect(body).toHaveProperty("data");
      expectTypeOf(body.data).toBeArray();
      expect(body.data.length).toBe(2);
    });

    it("should only include active camps", async () => {
      await CampFactory.create(campActivePublic);
      await CampFactory.create(campInactive);

      const { body } = await request().get(`/api/v1/camps/`).send();

      expect(body).toHaveProperty("data");
      expectTypeOf(body.data).toBeArray();
      expect(body.data.length).toBe(1);
    });
  });

  describe("GET /api/v1/camps/:campId", () => {
    it("should respond with `200` status code when camp is public", async () => {
      const camp = await CampFactory.create({
        active: true,
        public: true,
      });

      const { body } = await request()
        .get(`/api/v1/camps/${camp.id}`)
        .send()
        .expect(200);

      expect(body).toHaveProperty("data");
      expect(body.data).toEqual({
        id: camp.id,
        active: camp.active,
        public: camp.public,
        countries: camp.countries,
        name: camp.name,
        organization: camp.organization,
        contactEmail: camp.contactEmail,
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

    it("should respond with `200` status code when camp is private", async () => {
      const camp = await CampFactory.create({
        active: true,
        public: false,
      });

      await request().get(`/api/v1/camps/${camp.id}`).send().expect(200);
    });

    it("should respond with `200` status code when camp is not active and user is camp manager", async () => {
      const camp = await CampFactory.create({
        active: false,
      });
      const user = await UserFactory.create();
      await CampManagerFactory.create({
        camp: { connect: { id: camp.id } },
        user: { connect: { id: user.id } },
      });
      const accessToken = generateAccessToken(user);

      await request()
        .get(`/api/v1/camps/${camp.id}`)
        .send()
        .auth(accessToken, { type: "bearer" })
        .expect(200);
    });

    it("should respond with `401` status code when camp is not active and user is unauthenticated", async () => {
      const camp = await CampFactory.create({
        active: false,
      });

      await request().get(`/api/v1/camps/${camp.id}`).send().expect(401);
    });

    it("should respond with `403` status code when camp is not active and user is not a manager", async () => {
      const camp = await CampFactory.create({
        active: false,
      });
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .get(`/api/v1/camps/${camp.id}`)
        .send()
        .auth(accessToken, { type: "bearer" })
        .expect(403);
    });

    it("should respond with `404` status code when camp id does not exists", async () => {
      const campId = ulid();

      await request().get(`/api/v1/camps/${campId}`).send().expect(404);
    });
  });

  describe("POST /api/v1/camps", () => {
    const assertCampCreated = async (
      expected: PartialBy<Prisma.CampCreateInput, "id" | "form" | "themes">,
      actual: unknown,
    ) => {
      // Test response
      assertCampResponseBody(expected, actual);

      const id = (actual as { data: { id: string } }).data.id;
      await assertCampModel(id, expected);
    };

    it("should respond with `201` status code when user is authenticated", async () => {
      const accessToken = generateAccessToken(await UserFactory.create());
      const data = campCreateNational;

      const { body } = await request()
        .post(`/api/v1/camps/`)
        .send(data)
        .auth(accessToken, { type: "bearer" })
        .expect(201);

      // Test response
      await assertCampCreated(data, body);
    });

    it("should respond with `201` status code with international camp", async () => {
      const accessToken = generateAccessToken(await UserFactory.create());

      const data = campCreateInternational;

      const { body } = await request()
        .post(`/api/v1/camps/`)
        .send(data)
        .auth(accessToken, { type: "bearer" })
        .expect(201);

      // Test response
      await assertCampCreated(data, body);
    });

    it("should respond with `401` status code when unauthenticated", async () => {
      await request().post(`/api/v1/camps/`).send().expect(401);
    });

    it("should be inactive by default", async () => {
      const accessToken = generateAccessToken(await UserFactory.create());
      const data = {
        ...campCreateNational,
        active: undefined,
      };

      const { body } = await request()
        .post(`/api/v1/camps/`)
        .send(data)
        .auth(accessToken, { type: "bearer" })
        .expect(201);

      expect(body).toHaveProperty("data.active", false);
    });

    describe("invalid request body", () => {
      it.each(campCreateInvalidBody)(
        "should validate the request body | $name",
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async ({ name, data, expected }) => {
          const accessToken = generateAccessToken(await UserFactory.create());

          await request()
            .post(`/api/v1/camps/`)
            .send(data)
            .auth(accessToken, { type: "bearer" })
            .expect(expected);
        },
      );
    });
  });

  describe("PATCH /api/v1/camps/:campId", () => {
    it.todo(
      "should respond with `200` status code when user is camp manager",
      async () => {
        const { camp, accessToken } = await createCampWithManagerAndToken();

        // TODO Test each attribute individually
        const data = {
          active: true,
          public: false,
          countries: ["de"],
          name: "Test Camp",
          organization: "Test Org",
          contactEmail: "test@example.com",
          maxParticipants: 10,
          minAge: 10,
          maxAge: 15,
          startAt: moment()
            .add("20 days")
            .startOf("hour")
            .toDate()
            .toISOString(),
          endAt: moment().add("22 days").startOf("hour").toDate().toISOString(),
          price: 100.0,
          location: "Somewhere",
          form: {},
          themes: {},
        };

        const { body } = await request()
          .patch(`/api/v1/camps/${camp.id}`)
          .send(data)
          .auth(accessToken, { type: "bearer" })
          .expect(200);

        // Test response
        assertCampResponseBody(data, body);

        // Test model
        await assertCampModel(camp.id, data);
      },
    );

    it("should respond with `403` status code when user is not camp manager", async () => {
      const camp = await CampFactory.create();
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .patch(`/api/v1/camps/${camp.id}`)
        .send()
        .auth(accessToken, { type: "bearer" })
        .expect(403);
    });

    it("should respond with `401` status code when unauthenticated", async () => {
      const camp = await CampFactory.create();

      await request().patch(`/api/v1/camps/${camp.id}`).send().expect(401);
    });

    it.todo(
      "should respond with `400` status code when body is invalid",
      async () => {
        const { camp, accessToken } = await createCampWithManagerAndToken();
        // TODO Test all fields

        await request()
          .patch(`/api/v1/camps/${camp.id}`)
          .send()
          .auth(accessToken, { type: "bearer" })
          .expect(400);
      },
    );

    it("should respond with `404` status code when camp id does not exists", async () => {
      const accessToken = generateAccessToken(await UserFactory.create());
      const campId = ulid();
      const data = {
        public: true,
      };

      await request()
        .patch(`/api/v1/camps/${campId}`)
        .send(data)
        .auth(accessToken, { type: "bearer" })
        .expect(404);
    });
  });

  describe("DELETE /api/v1/camps/:campId", () => {
    it("should respond with `204` status code when user is camp manager", async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      const otherCamp = await CampFactory.create();

      await request()
        .delete(`/api/v1/camps/${camp.id}`)
        .send()
        .auth(accessToken, { type: "bearer" })
        .expect(204);

      const campCount = await prisma.camp.count();
      expect(campCount).toBe(1);

      const remainingCamp = await prisma.camp.findFirst();
      expect(remainingCamp?.id).toBe(otherCamp.id);
    });

    it("should respond with `403` status code when user is not camp manager", async () => {
      const camp = await CampFactory.create();
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .delete(`/api/v1/camps/${camp.id}`)
        .send()
        .auth(accessToken, { type: "bearer" })
        .expect(403);

      const campCount = await prisma.camp.count();
      expect(campCount).toBe(1);
    });

    it("should respond with `401` status code when unauthenticated", async () => {
      const camp = await CampFactory.create();

      await request().delete(`/api/v1/camps/${camp.id}`).send().expect(401);

      const campCount = await prisma.camp.count();
      expect(campCount).toBe(1);
    });

    it("should respond with `404` status code when camp id does not exists", async () => {
      const accessToken = generateAccessToken(await UserFactory.create());
      const campId = ulid();

      await request()
        .delete(`/api/v1/camps/${campId}`)
        .send()
        .auth(accessToken, { type: "bearer" })
        .expect(404);
    });

    it.todo("should delete all files");
  });
});
