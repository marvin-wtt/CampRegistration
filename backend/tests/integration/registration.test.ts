import { beforeEach, describe, expect, it } from "vitest";
import prisma from "../utils/prisma";
import { generateAccessToken } from "../utils/token";
import request from "supertest";
import app from "../../src/app";
import {
  CampFactory,
  FileFactory,
  RegistrationFactory,
  UserFactory,
} from "../../prisma/factories";
import { Camp, Registration, User } from "@prisma/client";
import { ulid } from "ulidx";

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
    context.camp = await CampFactory.create({
      public: true,
      form: {
        pages: [
          {
            name: "page1",
            elements: [
              {
                name: "first_name",
                type: "text",
                isRequired: true,
              },
              {
                name: "last_name",
                type: "text",
              },
            ],
          },
          {
            name: "page2",
            elements: [
              {
                name: "waiting_list",
                type: "boolean",
              },
              {
                name: "invisible_field",
                type: "text",
                isRequired: true,
                visible: false,
              },
            ],
          },
        ],
      },
      campManager: {
        create: {
          id: ulid(),
          userId: context.user.id,
        },
      },
    });
    context.registration = await RegistrationFactory.create({
      data: {
        first_name: "Jhon",
        last_name: "Doe",
      },
      camp: {
        connect: {
          id: context.camp.id,
        },
      },
    });

    context.accessToken = generateAccessToken(context.user);
    context.otherAccessToken = generateAccessToken(context.otherUser);
  });

  describe("GET /api/v1/camps/:campId/registrations/", () => {
    it<RegistrationTestContext>("should respond with `200` status code when user is camp manager", async (context) => {
      const { status, body } = await request(app)
        .get(`/api/v1/camps/${context.camp.id}/registrations`)
        .send()
        .set("Authorization", `Bearer ${context.accessToken}`);

      expect(status).toBe(200);
      expect(body).toHaveProperty("data");
      expect(body.data).toHaveLength(1);
      expect(body.data[0]).toHaveProperty("id");
      expect(body.data[0]).toHaveProperty("room");
    });

    it.todo("should set the users preferred locale");

    it<RegistrationTestContext>("should include files in the response body ", async (context) => {
      await FileFactory.create({
        field: "file_field",
        name: "file.pdf",
        type: "application/pdf",
        originalName: "FileName",
        size: 1000,
        registration: {
          connect: {
            id: context.registration.id,
          },
        },
      });

      await FileFactory.create({
        field: "multiple_files_field",
        name: "file1.pdf",
        type: "application/pdf",
        originalName: "FileName1",
        size: 1000,
        registration: {
          connect: {
            id: context.registration.id,
          },
        },
      });

      await FileFactory.create({
        field: "multiple_files_field",
        name: "file2.pdf",
        type: "application/pdf",
        originalName: "FileName2",
        size: 1000,
        registration: {
          connect: {
            id: context.registration.id,
          },
        },
      });

      const { status, body } = await request(app)
        .get(`/api/v1/camps/${context.camp.id}/registrations`)
        .send()
        .set("Authorization", `Bearer ${context.accessToken}`);

      expect(status).toBe(200);
      expect(body.data[0]).toHaveProperty(
        "file_field",
        expect.stringMatching(/.*file\.pdf$/),
      );
      expect(body.data[0]).toHaveProperty("multiple_files_field");
      expect(body.data[0]["multiple_files_field"].split(";").sort()).toEqual([
        expect.stringMatching(/.*file1\.pdf$/),
        expect.stringMatching(/.*file2\.pdf$/),
      ]);
    });

    it<RegistrationTestContext>("should respond with `403` status code when user is not camp manager", async (context) => {
      const { status } = await request(app)
        .get(`/api/v1/camps/${context.camp.id}/registrations`)
        .send()
        .set("Authorization", `Bearer ${context.otherAccessToken}`);

      expect(status).toBe(403);
    });

    it<RegistrationTestContext>("should respond with `401` status code when unauthenticated", async (context) => {
      const { status } = await request(app)
        .get(`/api/v1/camps/${context.camp.id}/registrations`)
        .send();

      expect(status).toBe(401);
    });

    it.todo(
      "should respond with `400` status code when query parameters are invalid",
    );
  });

  describe("GET /api/v1/camps/:campId/registrations/:registrationId", () => {
    it.todo("should respond with `200` status code when user is camp manager");

    it.todo("should include files in the response body ");

    it<RegistrationTestContext>("should respond with `403` status code when user is not camp manager", async (context) => {
      const { status } = await request(app)
        .get(
          `/api/v1/camps/${context.camp.id}/registrations/${context.registration.id}`,
        )
        .send()
        .set("Authorization", `Bearer ${context.otherAccessToken}`);

      expect(status).toBe(403);
    });

    it<RegistrationTestContext>("should respond with `401` status code when unauthenticated", async (context) => {
      const { status } = await request(app)
        .get(
          `/api/v1/camps/${context.camp.id}/registrations/${context.registration.id}`,
        )
        .send();

      expect(status).toBe(401);
    });

    it<RegistrationTestContext>("should respond with `404` status code when camp id does not exists", async (context) => {
      const id = "01H9XKPT4NRJB6F7Z0CDV8DCB";
      const { status } = await request(app)
        .get(`/api/v1/camps/${context.camp.id}/registrations/${id}`)
        .send()
        .set("Authorization", `Bearer ${context.accessToken}`);

      expect(status).toBe(404);
    });
  });

  describe("POST /api/v1/camps/:campId/registrations/", () => {
    it<RegistrationTestContext>("should respond with `201` status code", async (context) => {
      const data = {
        first_name: "Jhon",
        last_name: "Doe",
      };

      const { status, body } = await request(app)
        .post(`/api/v1/camps/${context.camp.id}/registrations`)
        .send(data);

      expect(status).toBe(201);

      expect(body).toHaveProperty("data");
      expect(body).toHaveProperty("data.id");
      expect(body).toHaveProperty("data.first_name");
      expect(body).toHaveProperty("data.last_name");
    });

    it<RegistrationTestContext>("should respond with `201` status code when form has file", async () => {
      const camp = await CampFactory.create({
        public: true,
        form: {
          pages: [
            {
              elements: [
                {
                  name: "some_field",
                  type: "text",
                  isRequired: true,
                },
                {
                  name: "some_file",
                  type: "file",
                  isRequired: true,
                },
              ],
            },
          ],
        },
      });

      const { status, body } = await request(app)
        .post(`/api/v1/camps/${camp.id}/registrations`)
        .field("some_field", "Some value")
        .attach("some_file", `${__dirname}/resources/blank.pdf`);

      expect(status).toBe(201);
      expect(body).toHaveProperty("data.some_file");
    });

    it<RegistrationTestContext>("should respond with `401` status code when camp is private", async () => {
      const privateCamp = await CampFactory.create({
        public: false,
      });

      const { status } = await request(app)
        .post(`/api/v1/camps/${privateCamp.id}/registrations`)
        .send();

      expect(status).toBe(401);
    });

    it<RegistrationTestContext>("should respond with `400` status code when additional fields are provided", async (context) => {
      const data = {
        first_name: "Jhon",
        last_name: "Doe",
        invisible_field: "should not be stored",
        another_field: "should not be stored",
      };

      const { status } = await request(app)
        .post(`/api/v1/camps/${context.camp.id}/registrations`)
        .send(data);

      expect(status).toBe(400);
    });

    it<RegistrationTestContext>("should respond with `400` status code when a required field is missing", async (context) => {
      const data = {
        last_name: "Doe",
      };

      const { status } = await request(app)
        .post(`/api/v1/camps/${context.camp.id}/registrations`)
        .send(data);

      expect(status).toBe(400);
    });

    it.todo("should respond with `400` status code when file is missing");
  });

  describe("PUT /api/v1/camps/:campId/registrations/:registrationId", () => {
    it.todo("should respond with `200` status code when user is camp manager");

    it.todo("should upload files if attached");

    it<RegistrationTestContext>("should respond with `403` status code when user is not camp manager", async (context) => {
      const { status } = await request(app)
        .put(
          `/api/v1/camps/${context.camp.id}/registrations/${context.registration.id}`,
        )
        .send({})
        .set("Authorization", `Bearer ${context.otherAccessToken}`);

      expect(status).toBe(403);
    });

    it<RegistrationTestContext>("should respond with `401` status code when unauthenticated", async (context) => {
      const { status } = await request(app)
        .put(
          `/api/v1/camps/${context.camp.id}/registrations/${context.registration.id}`,
        )
        .send({});

      expect(status).toBe(401);
    });

    it.todo("should respond with `400` status code when request body is empty");

    it<RegistrationTestContext>("should respond with `404` status code when registration id does not exists", async (context) => {
      const id = "01H9XKPT4NRJB6F7Z0CDV8DCB";
      const data = {
        public: true,
      };
      const { status } = await request(app)
        .patch(`/api/v1/camps/${context.camp.id}/registrations/${id}`)
        .send(data)
        .set("Authorization", `Bearer ${context.accessToken}`);

      expect(status).toBe(404);
    });
  });

  describe("DELETE /api/v1/camps/:campId/registrations/:registrationId", () => {
    it<RegistrationTestContext>("should respond with `204` status code when user is camp manager", async (context) => {
      const { status } = await request(app)
        .delete(
          `/api/v1/camps/${context.camp.id}/registrations/${context.registration.id}`,
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
          `/api/v1/camps/${context.camp.id}/registrations/${context.registration.id}`,
        )
        .send()
        .set("Authorization", `Bearer ${context.otherAccessToken}`);

      const registrationCount = await prisma.registration.count();

      expect(status).toBe(403);
      expect(registrationCount).toBe(1);
    });

    it<RegistrationTestContext>("should respond with `401` status code when unauthenticated", async (context) => {
      const { status } = await request(app)
        .delete(
          `/api/v1/camps/${context.camp.id}/registrations/${context.registration.id}`,
        )
        .send();

      const registrationCount = await prisma.registration.count();

      expect(status).toBe(401);
      expect(registrationCount).toBe(1);
    });

    it<RegistrationTestContext>("should respond with `404` status code when registration id does not exists", async (context) => {
      const id = "01H9XKPT4NRJB6F7Z0CDV8DCB";
      const { status } = await request(app)
        .delete(`/api/v1/camps/${context.camp.id}/registrations/${id}`)
        .send()
        .set("Authorization", `Bearer ${context.accessToken}`);

      expect(status).toBe(404);
    });
  });
});
