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
import crypto from "crypto";
import {
  campWithFileOptional,
  campWithFileRequired,
  campWithMaxParticipantsInternational,
  campWithMaxParticipantsNational,
  campWithMaxParticipantsRolesInternational,
  campWithMaxParticipantsRolesNational,
} from "../fixtures/registration/camp.fixtures";

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
      active: true,
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

    it.todo<RegistrationTestContext>(
      "should include files in the response body ",
      async (context) => {
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

        // TODO Create new registration with files
        const { status, body } = await request(app)
          .get(`/api/v1/camps/${context.camp.id}/registrations`)
          .send()
          .set("Authorization", `Bearer ${context.accessToken}`);

        expect(status).toBe(200);

        expect(body[0]).toHaveProperty("files");

        // TODO Assert files
        // expect(body.data[0]).toHaveProperty(
        //   "file_field",
        //   expect.stringMatching(/.*file\.pdf$/),
        // );
        // expect(body.data[0]).toHaveProperty("multiple_files_field");
        // expect(body.data[0]["multiple_files_field"].split(";").sort()).toEqual([
        //   expect.stringMatching(/.*file1\.pdf$/),
        //   expect.stringMatching(/.*file2\.pdf$/),
        // ]);
      },
    );

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
        data: {
          first_name: "Jhon",
          last_name: "Doe",
        },
      };
      await CampFactory.create();

      const { status, body } = await request(app)
        .post(`/api/v1/camps/${context.camp.id}/registrations`)
        .send(data);

      expect(status).toBe(201);

      expect(body).toHaveProperty("data");
      expect(body).toHaveProperty("data.id");
      expect(body).toHaveProperty("data.data");
      expect(body).toHaveProperty("data.data.first_name", "Jhon");
      expect(body).toHaveProperty("data.data.last_name", "Doe");
      expect(body).toHaveProperty("data.created_at");
      expect(body).toHaveProperty("data.updated_at");
    });

    it.todo("should respond with `201` status code for private camps");

    it.todo(
      "should respond with `201` status code when camp is full and waiting list is enabled",
    );

    it.todo("accepts custom question types");

    it<RegistrationTestContext>("should respond with `401` status code when camp is not active", async () => {
      const privateCamp = await CampFactory.create({
        active: false,
      });

      const { status } = await request(app)
        .post(`/api/v1/camps/${privateCamp.id}/registrations`)
        .send();

      expect(status).toBe(401);
    });

    it<RegistrationTestContext>("should respond with `400` status code when additional fields are provided", async (context) => {
      const data = {
        data: {
          first_name: "Jhon",
          last_name: "Doe",
          invisible_field: "should not be stored",
          another_field: "should not be stored",
        },
      };

      const { status } = await request(app)
        .post(`/api/v1/camps/${context.camp.id}/registrations`)
        .send(data);

      expect(status).toBe(400);
    });

    it<RegistrationTestContext>("should respond with `400` status code when a required field is missing", async (context) => {
      const data = {
        data: {
          last_name: "Doe",
        },
      };

      const { status } = await request(app)
        .post(`/api/v1/camps/${context.camp.id}/registrations`)
        .send(data);

      expect(status).toBe(400);
    });

    it.todo(
      "should respond with `400` status code when additional files are provided",
    );

    describe("registration with files", () => {
      it("should respond with `201` status code when form has file", async () => {
        const camp = await CampFactory.create(campWithFileRequired);

        const fileUuid = crypto.randomUUID();
        const { status, body } = await request(app)
          .post(`/api/v1/camps/${camp.id}/registrations`)
          .field({
            ["data[some_field]"]: "Some value",
            ["data[some_file]"]: fileUuid,
          })
          .attach(`files[${fileUuid}]`, `${__dirname}/resources/blank.pdf`);

        expect(status).toBe(201);
        expect(body).toHaveProperty(`data.files.${fileUuid}`);
      });

      it("should respond with `400` status code when file is missing", async () => {
        const camp = await CampFactory.create(campWithFileRequired);

        const fileUuid = crypto.randomUUID();
        const { status } = await request(app)
          .post(`/api/v1/camps/${camp.id}/registrations`)
          .field({
            ["data[some_field]"]: "Some value",
            ["data[some_file]"]: fileUuid,
          });

        expect(status).toBe(400);
      });

      it("should respond with `400` status code when file id is incorrect", async () => {
        const camp = await CampFactory.create(campWithFileRequired);

        const fileUuid = crypto.randomUUID();
        const wrongFileUuid = crypto.randomUUID();
        const { status } = await request(app)
          .post(`/api/v1/camps/${camp.id}/registrations`)
          .field({
            ["data[some_field]"]: "Some value",
            ["data[some_file]"]: wrongFileUuid,
          })
          .attach(`files[${fileUuid}]`, `${__dirname}/resources/blank.pdf`);

        expect(status).toBe(400);
      });

      it("should respond with `400` status code when file field is missing", async () => {
        const camp = await CampFactory.create(campWithFileRequired);

        const fileUuid = crypto.randomUUID();
        const { status } = await request(app)
          .post(`/api/v1/camps/${camp.id}/registrations`)
          .field({
            ["data[some_field]"]: "Some value",
          })
          .attach(`files[${fileUuid}]`, `${__dirname}/resources/blank.pdf`);

        expect(status).toBe(400);
      });

      it("should respond with `400` status code when field is missing", async () => {
        const camp = await CampFactory.create(campWithFileRequired);

        const fileUuid = crypto.randomUUID();
        const { status } = await request(app)
          .post(`/api/v1/camps/${camp.id}/registrations`)
          .field({
            ["data[some_file]"]: fileUuid,
          })
          .attach(`files[${fileUuid}]`, `${__dirname}/resources/blank.pdf`);

        expect(status).toBe(400);
      });

      it("should respond with `201` status code when file is optional", async () => {
        const camp = await CampFactory.create(campWithFileOptional);

        const { status } = await request(app)
          .post(`/api/v1/camps/${camp.id}/registrations`)
          .field({
            ["data[some_field]"]: "Some value",
          });

        expect(status).toBe(201);
      });
    });

    describe("waiting list", () => {
      const assertRegistration = async (
        campId: string,
        data: unknown,
        expected: boolean,
      ) => {
        const { status, body } = await request(app)
          .post(`/api/v1/camps/${campId}/registrations`)
          .send({ data });

        expect(status).toBe(201);
        expect(body).toHaveProperty("data.waitingList", expected);
      };

      it("should set waiting list for national camps", async () => {
        const camp = await CampFactory.create(campWithMaxParticipantsNational);

        // Fill camp
        for (let i = 0; i < 5; i++) {
          await assertRegistration(
            camp.id,
            {
              first_name: `Jhon ${i}`,
            },
            false,
          );
        }

        // Assert waiting list
        await assertRegistration(
          camp.id,
          {
            first_name: `Jhon`,
          },
          true,
        );
      });

      it("should set waiting list for international camps", async () => {
        const camp = await CampFactory.create(
          campWithMaxParticipantsInternational,
        );

        // Fill camp
        for (let i = 0; i < 5; i++) {
          await assertRegistration(
            camp.id,
            {
              first_name: `Jhon ${i}`,
              country: "de",
            },
            false,
          );
        }

        // Assert waiting list
        await assertRegistration(
          camp.id,
          {
            first_name: `Jhon`,
            country: "de",
          },
          true,
        );

        // Other nation should not be on waiting list
        await assertRegistration(
          camp.id,
          {
            first_name: `Jhon`,
            country: "fr",
          },
          false,
        );
      });

      it("should set waiting list for participants in national camps with roles", async () => {
        const camp = await CampFactory.create(
          campWithMaxParticipantsRolesNational,
        );

        // Add a counselor
        await assertRegistration(
          camp.id,
          {
            first_name: `Tom`,
            role: "counselor",
          },
          false,
        );

        // Fill camp
        for (let i = 0; i < 5; i++) {
          await assertRegistration(
            camp.id,
            {
              first_name: `Jhon ${i}`,
              role: "participant",
            },
            false,
          );
        }

        // Assert waiting list
        await assertRegistration(
          camp.id,
          {
            first_name: `Jhon`,
            role: "participant",
          },
          true,
        );

        // Check another counselor
        await assertRegistration(
          camp.id,
          {
            first_name: `Mary`,
            role: "counselor",
          },
          false,
        );
      });

      it("should set waiting list for participants in international camps with roles", async () => {
        const camp = await CampFactory.create(
          campWithMaxParticipantsRolesInternational,
        );

        // Add a counselor
        await assertRegistration(
          camp.id,
          {
            first_name: `Tom`,
            role: "counselor",
            country: "de",
          },
          false,
        );

        // Fill camp
        for (let i = 0; i < 5; i++) {
          await assertRegistration(
            camp.id,
            {
              first_name: `Jhon ${i}`,
              role: "participant",
              country: "de",
            },
            false,
          );
        }

        // Assert waiting list
        await assertRegistration(
          camp.id,
          {
            first_name: `Jhon`,
            role: "participant",
            country: "de",
          },
          true,
        );

        // Check another counselor
        await assertRegistration(
          camp.id,
          {
            first_name: `Mary`,
            role: "counselor",
            country: "de",
          },
          false,
        );

        // Check participant from other nation
        await assertRegistration(
          camp.id,
          {
            first_name: `Larry`,
            role: "participant",
            country: "fr",
          },
          false,
        );
      });

      it("should respond with `400` status code when the waiting list field is set", async () => {
        const camp = await CampFactory.create(campWithMaxParticipantsNational);

        const data = {
          data: {
            first_name: `Jhon`,
          },
          waitingList: false,
        };

        const { status } = await request(app)
          .post(`/api/v1/camps/${camp.id}/registrations`)
          .send(data);

        expect(status).toBe(400);
      });
    });
  });

  describe("PUT /api/v1/camps/:campId/registrations/:registrationId", () => {
    it.todo("should respond with `200` status code when user is camp manager");

    it.todo("should respond with `200` status when waiting list is updated");

    it.todo("should upload files if attached");

    it<RegistrationTestContext>("should respond with `403` status code when user is not camp manager", async (context) => {
      const { status } = await request(app)
        .put(
          `/api/v1/camps/${context.camp.id}/registrations/${context.registration.id}`,
        )
        .send({
          data: {},
        })
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
        data: {
          public: true,
        },
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

    it<RegistrationTestContext>("should respond with `404` status code when registration id does not exists", async (context) => {});
  });
});
