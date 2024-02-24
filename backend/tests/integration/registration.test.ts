import { describe, expect, it } from 'vitest';
import prisma from '../utils/prisma';
import { generateAccessToken } from '../utils/token';
import {
  CampFactory,
  FileFactory,
  RegistrationFactory,
  UserFactory,
} from '../../prisma/factories';
import { Camp } from '@prisma/client';
import { ulid } from 'ulidx';
import crypto from 'crypto';
import {
  campPrivate,
  campPublic,
  campWithAdditionalFields,
  campWithCampVariable,
  campWithCustomFields,
  campWithFileOptional,
  campWithFileRequired,
  campWithMaxParticipantsInternational,
  campWithMaxParticipantsNational,
  campWithMaxParticipantsRolesInternational,
  campWithMaxParticipantsRolesNational,
  campWithMultipleCampDataTypes,
  campWithMultipleCampDataValues,
  campWithRequiredField,
  campWithSingleCampDataType,
  campWithoutCountryData,
  campWithEmail,
  campWithMultipleEmails,
  campWithContactEmailInternational,
  campWithEmailAndMaxParticipants,
  campWithFormFunctions,
} from '../fixtures/registration/camp.fixtures';
import { request } from '../utils/request';
import { CampManagerFactory } from '../../prisma/factories/manager';
import mailer from '../../src/config/mail';

describe('/api/v1/camps/:campId/registrations', () => {
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

  const createRegistration = async (camp: Camp) => {
    return RegistrationFactory.create({
      camp: { connect: { id: camp.id } },
    });
  };

  const countRegistrations = async (camp: Camp) => {
    return prisma.registration.count({
      where: {
        campId: camp.id,
      },
    });
  };

  describe('GET /api/v1/camps/:campId/registrations/', () => {
    it('should respond with `200` status code when user is camp manager', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      await createRegistration(camp);

      const { body } = await request()
        .get(`/api/v1/camps/${camp.id}/registrations`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body).toHaveProperty('data');
      expect(body.data).toHaveLength(1);
      expect(body.data[0]).toHaveProperty('id');
      expect(body.data[0]).toHaveProperty('room');
    });

    it('should respond with `403` status code when user is not camp manager', async () => {
      const camp = await CampFactory.create();
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .get(`/api/v1/camps/${camp.id}/registrations`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const camp = await CampFactory.create();

      await request()
        .get(`/api/v1/camps/${camp.id}/registrations`)
        .send()
        .expect(401);
    });

    it.todo(
      'should respond with `400` status code when query parameters are invalid',
    );
  });

  describe('GET /api/v1/camps/:campId/registrations/:registrationId', () => {
    it('should respond with `200` status code when user is camp manager', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      const registration = await createRegistration(camp);

      const { body } = await request()
        .get(`/api/v1/camps/${camp.id}/registrations/${registration.id}/`)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body).toHaveProperty('data');
    });

    it('should respond with `403` status code when user is not camp manager', async () => {
      const camp = await CampFactory.create();
      const accessToken = generateAccessToken(await UserFactory.create());
      const registration = await createRegistration(camp);

      await request()
        .get(`/api/v1/camps/${camp.id}/registrations/${registration.id}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const camp = await CampFactory.create();
      const registration = await createRegistration(camp);

      await request()
        .get(`/api/v1/camps/${camp.id}/registrations/${registration.id}`)
        .send()
        .expect(401);
    });

    it('should respond with `404` status code when camp id does not exists', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      const registrationId = ulid();

      await request()
        .get(`/api/v1/camps/${camp.id}/registrations/${registrationId}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });
  });

  describe('POST /api/v1/camps/:campId/registrations/', () => {
    it('should respond with `201` status code', async () => {
      const camp = await CampFactory.create(campPublic);

      const data = {
        data: {
          first_name: 'Jhon',
          last_name: 'Doe',
        },
      };

      const { body } = await request()
        .post(`/api/v1/camps/${camp.id}/registrations`)
        .send(data)
        .expect(201);

      expect(body).toHaveProperty('data');
      expect(body).toHaveProperty('data.id');
      expect(body).toHaveProperty('data.data');
      expect(body).toHaveProperty('data.data.first_name', 'Jhon');
      expect(body).toHaveProperty('data.data.last_name', 'Doe');
      expect(body).toHaveProperty('data.createdAt');
      expect(body).toHaveProperty('data.updatedAt');
    });

    it('should respond with `201` status code for private camps', async () => {
      const camp = await CampFactory.create(campPrivate);

      const data = {
        first_name: 'Jhon',
      };

      await request()
        .post(`/api/v1/camps/${camp.id}/registrations`)
        .send({ data })
        .expect(201);
    });

    it('should respond with `201` status code when form has custom questions', async () => {
      const camp = await CampFactory.create(campWithCustomFields);

      const data = {
        first_name: 'Jhon',
        role: 'participant',
      };

      const { body } = await request()
        .post(`/api/v1/camps/${camp.id}/registrations`)
        .send({ data })
        .expect(201);

      expect(body).toHaveProperty('data.data.role', data.role);
    });

    it('should respond with `401` status code when camp is not active', async () => {
      const camp = await CampFactory.create({
        active: false,
      });

      await request()
        .post(`/api/v1/camps/${camp.id}/registrations`)
        .send()
        .expect(401);
    });

    it('should respond with `400` status code when additional fields are provided', async () => {
      const camp = await CampFactory.create(campWithAdditionalFields);

      const data = {
        data: {
          first_name: 'Jhon',
          invisible_field: 'should not be stored',
          another_field: 'should not be stored',
        },
      };

      await request()
        .post(`/api/v1/camps/${camp.id}/registrations`)
        .send(data)
        .expect(400);
    });

    it('should respond with `400` status code when a required field is missing', async () => {
      const camp = await CampFactory.create(campWithRequiredField);

      const data = {
        data: {
          last_name: 'Doe',
        },
      };

      await request()
        .post(`/api/v1/camps/${camp.id}/registrations`)
        .send(data)
        .expect(400);
    });

    it('should work with camp variables', async () => {
      const camp = await CampFactory.create(campWithCampVariable);

      const validData = {
        first_name: 'Jhon',
        age: 11,
      };

      await request()
        .post(`/api/v1/camps/${camp.id}/registrations`)
        .send({ data: validData })
        .expect(201);

      const invalidData = {
        first_name: 'Jhon',
        age: 5,
      };

      await request()
        .post(`/api/v1/camps/${camp.id}/registrations`)
        .send({ data: invalidData })
        .expect(400);
    });

    it('should work with form functions', async () => {
      const camp = await CampFactory.create(campWithFormFunctions);

      const validData = {
        date: '2000-01-01',
      };

      await request()
        .post(`/api/v1/camps/${camp.id}/registrations`)
        .send({ data: validData })
        .expect(201);

      const invalidData = {
        date: '2001-01-01',
      };

      await request()
        .post(`/api/v1/camps/${camp.id}/registrations`)
        .send({ data: invalidData })
        .expect(400);
    });

    describe('locale', () => {
      it('should set the users preferred locale', async () => {
        const camp = await CampFactory.create(campPublic);

        const data = {
          data: {
            first_name: 'Jhon',
          },
        };

        const { body } = await request()
          .post(`/api/v1/camps/${camp.id}/registrations`)
          .set(
            'Accept-Language',
            'fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7, *;q=0.5',
          )
          .send(data)
          .expect(201);

        expect(body).toHaveProperty('data');
        expect(body).toHaveProperty('data.locale', 'fr-CH');
      });

      it('should use given locale over users preferred locale', async () => {
        const camp = await CampFactory.create(campPublic);

        const data = {
          data: {
            first_name: 'Jhon',
          },
          locale: 'de',
        };

        const { body } = await request()
          .post(`/api/v1/camps/${camp.id}/registrations`)
          .set(
            'Accept-Language',
            'fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7, *;q=0.5',
          )
          .send(data)
          .expect(201);

        expect(body).toHaveProperty('data');
        expect(body).toHaveProperty('data.locale', 'de');
      });
    });

    describe('files', () => {
      it('should respond with `201` status code when form has file', async () => {
        const camp = await CampFactory.create(campWithFileRequired);
        const file = await FileFactory.create({
          field: crypto.randomUUID(),
          accessLevel: 'private',
        });

        const data = {
          some_field: 'Some value',
          some_file: `${file.id}#${file.field}`,
        };

        const { body } = await request()
          .post(`/api/v1/camps/${camp.id}/registrations`)
          .send({ data })
          .expect(201);

        expect(body).toHaveProperty(`data.id`);
        expect(body).toHaveProperty(`data.data.some_file`);

        const expectedUrl = `/api/v1/camps/${camp.id}/registrations/${body.data.id}/files/${file.id}/`;
        expect(body.data.data.some_file.endsWith(expectedUrl)).toBeTruthy();

        const updatedFile = await prisma.file.findFirst({
          where: { id: file.id },
        });

        expect(updatedFile.registrationId).toBe(body.data.id);
      });

      it('should respond with `201` status code when file is optional', async () => {
        const camp = await CampFactory.create(campWithFileOptional);

        const data = {
          some_field: 'Some value',
        };

        await request()
          .post(`/api/v1/camps/${camp.id}/registrations`)
          .send({ data })
          .expectOrPrint(201);
      });

      it('should respond with `400` status code when file is missing', async () => {
        const camp = await CampFactory.create(campWithFileRequired);
        const fileId = ulid();
        const fileField = crypto.randomUUID();

        const data = {
          some_field: 'Some value',
          some_file: `${fileId}#${fileField}`,
        };

        await request()
          .post(`/api/v1/camps/${camp.id}/registrations`)
          .send({ data })
          .expect(400);
      });

      it('should respond with `400` status code when file field is missing', async () => {
        const camp = await CampFactory.create(campWithFileRequired);
        const file = await FileFactory.create({
          field: crypto.randomUUID(),
          accessLevel: 'private',
        });

        const data = {
          some_field: 'Some value',
          some_file: `${file.id}`,
        };

        await request()
          .post(`/api/v1/camps/${camp.id}/registrations`)
          .send({ data })
          .expect(400);
      });

      it('should respond with `400` status code when file field is invalid', async () => {
        const camp = await CampFactory.create(campWithFileRequired);
        const file = await FileFactory.create({
          field: crypto.randomUUID(),
          accessLevel: 'private',
        });

        const invalidField = crypto.randomUUID();
        const data = {
          some_field: 'Some value',
          some_file: `${file.id}#${invalidField}`,
        };

        await request()
          .post(`/api/v1/camps/${camp.id}/registrations`)
          .send({ data })
          .expect(400);
      });

      it('should respond with `400` status code when file data is invalid', async () => {
        const camp = await CampFactory.create(campWithFileRequired);

        const data = {
          some_field: 'Some value',
          some_file: {
            name: 'test',
            size: 100,
          },
        };

        await request()
          .post(`/api/v1/camps/${camp.id}/registrations`)
          .send({ data })
          .expect(400);
      });

      it('should respond with `400` status code when file is already assigned to a registration', async () => {
        const camp = await CampFactory.create(campWithFileRequired);
        const file = await FileFactory.create({
          field: crypto.randomUUID(),
          accessLevel: 'private',
          registration: { create: RegistrationFactory.build() },
        });

        const data = {
          some_field: 'Some value',
          some_file: `${file.id}#${file.field}`,
        };

        await request()
          .post(`/api/v1/camps/${camp.id}/registrations`)
          .send({ data })
          .expect(400);
      });

      it('should respond with `400` status code when file is already assigned to a camp', async () => {
        const camp = await CampFactory.create(campWithFileRequired);
        const file = await FileFactory.create({
          field: crypto.randomUUID(),
          accessLevel: 'private',
          camp: { connect: { id: camp.id } },
        });

        const data = {
          some_field: 'Some value',
          some_file: `${file.id}#${file.field}`,
        };

        await request()
          .post(`/api/v1/camps/${camp.id}/registrations`)
          .send({ data })
          .expect(400);
      });
    });

    describe('generate camp data', () => {
      it('should add entry with single value', async () => {
        const camp = await CampFactory.create(campWithSingleCampDataType);

        const data = {
          email: 'test@example.com',
          other: 'dummy',
        };

        const { body } = await request()
          .post(`/api/v1/camps/${camp.id}/registrations`)
          .send({ data })
          .expect(201);

        expect(body).toHaveProperty('data.campData');
        expect(body.data.campData).toEqual({
          'email-primary': ['test@example.com'],
        });
      });

      it('should add entry without values', async () => {
        const camp = await CampFactory.create(campWithSingleCampDataType);

        const data = {
          other: 'dummy',
        };

        const { body } = await request()
          .post(`/api/v1/camps/${camp.id}/registrations`)
          .send({ data })
          .expect(201);

        expect(body).toHaveProperty('data.campData');
        expect(body.data.campData).toEqual({
          'email-primary': [null],
        });
      });

      it('should add entry with multiple values', async () => {
        const camp = await CampFactory.create(campWithMultipleCampDataValues);

        const data = {
          email: 'test@example.com',
          otherEmail: 'other@example.com',
          other: 'dummy',
        };

        const { body } = await request()
          .post(`/api/v1/camps/${camp.id}/registrations`)
          .send({ data })
          .expect(201);

        expect(body).toHaveProperty('data.campData');
        expect(body.data.campData).toEqual({
          'email-primary': ['test@example.com', 'other@example.com'],
        });
      });

      it('should add multiple entries', async () => {
        const camp = await CampFactory.create(campWithMultipleCampDataTypes);

        const data = {
          email: 'test@example.com',
          country: 'de',
          other: 'dummy',
        };

        const { body } = await request()
          .post(`/api/v1/camps/${camp.id}/registrations`)
          .send({ data })
          .expect(201);

        expect(body).toHaveProperty('data.campData');
        expect(body.data.campData).toEqual({
          'email-primary': ['test@example.com'],
          country: ['de'],
        });
      });
    });

    describe('waiting list', () => {
      const assertRegistration = async (
        campId: string,
        data: unknown,
        expected: boolean,
      ) => {
        const { body } = await request()
          .post(`/api/v1/camps/${campId}/registrations`)
          .send({ data })
          .expect(201);

        expect(body).toHaveProperty('data.waitingList', expected);
      };

      it('should set waiting list for national camps', async () => {
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

      it('should set waiting list for international camps', async () => {
        const camp = await CampFactory.create(
          campWithMaxParticipantsInternational,
        );

        // Fill camp
        for (let i = 0; i < 5; i++) {
          await assertRegistration(
            camp.id,
            {
              first_name: `Jhon ${i}`,
              country: 'de',
            },
            false,
          );
        }

        // Assert waiting list
        await assertRegistration(
          camp.id,
          {
            first_name: `Jhon`,
            country: 'de',
          },
          true,
        );

        // Other nation should not be on waiting list
        await assertRegistration(
          camp.id,
          {
            first_name: `Jhon`,
            country: 'fr',
          },
          false,
        );
      });

      it('should set waiting list for participants in national camps with roles', async () => {
        const camp = await CampFactory.create(
          campWithMaxParticipantsRolesNational,
        );

        // Add a counselor
        await assertRegistration(
          camp.id,
          {
            first_name: `Tom`,
            role: 'counselor',
          },
          false,
        );

        // Fill camp
        for (let i = 0; i < 5; i++) {
          await assertRegistration(
            camp.id,
            {
              first_name: `Jhon ${i}`,
              role: 'participant',
            },
            false,
          );
        }

        // Assert waiting list
        await assertRegistration(
          camp.id,
          {
            first_name: `Jhon`,
            role: 'participant',
          },
          true,
        );

        // Check another counselor
        await assertRegistration(
          camp.id,
          {
            first_name: `Mary`,
            role: 'counselor',
          },
          false,
        );
      });

      it('should set waiting list for participants in international camps with roles', async () => {
        const camp = await CampFactory.create(
          campWithMaxParticipantsRolesInternational,
        );

        // Add a counselor
        await assertRegistration(
          camp.id,
          {
            first_name: `Tom`,
            role: 'counselor',
            country: 'de',
          },
          false,
        );

        // Fill camp
        for (let i = 0; i < 5; i++) {
          await assertRegistration(
            camp.id,
            {
              first_name: `Jhon ${i}`,
              role: 'participant',
              country: 'de',
            },
            false,
          );
        }

        // Assert waiting list
        await assertRegistration(
          camp.id,
          {
            first_name: `Jhon`,
            role: 'participant',
            country: 'de',
          },
          true,
        );

        // Check another counselor
        await assertRegistration(
          camp.id,
          {
            first_name: `Mary`,
            role: 'counselor',
            country: 'de',
          },
          false,
        );

        // Check participant from other nation
        await assertRegistration(
          camp.id,
          {
            first_name: `Larry`,
            role: 'participant',
            country: 'fr',
          },
          false,
        );
      });

      it('should respond with `400` status code when the waiting list field is set', async () => {
        const camp = await CampFactory.create(campWithMaxParticipantsNational);

        const data = {
          data: {
            first_name: `Jhon`,
          },
          waitingList: false,
        };

        await request()
          .post(`/api/v1/camps/${camp.id}/registrations`)
          .send(data)
          .expect(400);
      });

      it('should respond with `400` status code when camp country data is missing for international camp', async () => {
        const camp = await CampFactory.create(campWithoutCountryData);

        const data = {
          data: {
            first_name: `Jhon`,
          },
        };

        await request()
          .post(`/api/v1/camps/${camp.id}/registrations`)
          .send(data)
          .expect(400);
      });

      it('should respond with `400` status code when camp country data is invalid for international camp', async () => {
        const camp = await CampFactory.create(campWithoutCountryData);

        const data = {
          data: {
            first_name: `Jhon`,
            country: 1,
          },
        };

        await request()
          .post(`/api/v1/camps/${camp.id}/registrations`)
          .send(data)
          .expect(400);
      });

      it('should respond with `400` status code when camp country data is not matching for international camp', async () => {
        const camp = await CampFactory.create(campWithoutCountryData);

        const data = {
          data: {
            first_name: `Jhon`,
            country: 'us',
          },
        };

        await request()
          .post(`/api/v1/camps/${camp.id}/registrations`)
          .send(data)
          .expect(400);
      });
    });

    describe('sends notification', () => {
      it('should send a confirmation email to the user', async () => {
        const camp = await CampFactory.create(campWithEmail);

        const data = {
          email: 'test@example.com',
          first_name: 'Jhon',
          last_name: 'Doe',
        };

        await request()
          .post(`/api/v1/camps/${camp.id}/registrations`)
          .send({ data })
          .expect(201);

        expect(mailer.sendMail).toHaveBeenCalledWith(
          expect.objectContaining({
            to: [data.email],
            replyTo: camp.contactEmail,
          }),
        );
      });

      it('should send a confirmation email to multiple emails', async () => {
        const camp = await CampFactory.create(campWithMultipleEmails);

        const data = {
          email: 'test@example.com',
          emailGuardian: 'guardian@example.com',
          full_name: 'Jhon Doe',
        };

        await request()
          .post(`/api/v1/camps/${camp.id}/registrations`)
          .send({ data })
          .expect(201);

        expect(mailer.sendMail).toHaveBeenCalledWith(
          expect.objectContaining({
            to: expect.arrayContaining([data.email, data.emailGuardian]),
            replyTo: camp.contactEmail,
          }),
        );
      });

      it('should send a copy to the contact email for national camp', async () => {
        const camp = await CampFactory.create(campWithEmail);

        const data = {
          email: 'test@example.com',
          first_name: 'Jhon',
        };

        await request()
          .post(`/api/v1/camps/${camp.id}/registrations`)
          .send({ data })
          .expect(201);

        expect(mailer.sendMail).toHaveBeenCalledWith(
          expect.objectContaining({
            to: camp.contactEmail,
            replyTo: expect.arrayContaining([data.email]),
          }),
        );
      });

      it('should send a copy to the contact emails for international camp', async () => {
        const camp = await CampFactory.create(
          campWithContactEmailInternational,
        );

        const data = {
          country: 'de',
        };

        await request()
          .post(`/api/v1/camps/${camp.id}/registrations`)
          .send({ data })
          .expect(201);

        const expectedEmail = campWithContactEmailInternational.contactEmail.de;
        expect(mailer.sendMail).toHaveBeenCalledWith(
          expect.objectContaining({
            to: expectedEmail,
          }),
        );
      });

      it('should send a copy to all contact emails if country missing', async () => {
        const camp = await CampFactory.create(
          campWithContactEmailInternational,
        );

        const data = {};
        await request()
          .post(`/api/v1/camps/${camp.id}/registrations`)
          .send({ data })
          .expect(201);

        const expectedEmails = Object.values(
          campWithContactEmailInternational.contactEmail,
        );

        expect(mailer.sendMail).toHaveBeenCalledWith(
          expect.objectContaining({
            to: expect.arrayContaining(expectedEmails),
          }),
        );
      });

      it('should send a waiting list information to the user', async () => {
        const camp = await CampFactory.create(campWithEmailAndMaxParticipants);

        const data = {
          email: 'test@example.com',
        };

        await request()
          .post(`/api/v1/camps/${camp.id}/registrations`)
          .send({ data })
          .expect(201);

        expect(mailer.sendMail).toHaveBeenCalledWith(
          expect.objectContaining({
            to: [data.email],
          }),
        );
      });
    });
  });

  describe('PUT /api/v1/camps/:campId/registrations/:registrationId', () => {
    it.todo('should respond with `200` status code when user is camp manager');

    it.todo('should respond with `200` status when waiting list is updated');

    it.todo('should upload files if attached');

    it('should respond with `403` status code when user is not camp manager', async () => {
      const accessToken = generateAccessToken(await UserFactory.create());
      const camp = await CampFactory.create();
      const registration = await createRegistration(camp);

      await request()
        .put(`/api/v1/camps/${camp.id}/registrations/${registration.id}`)
        .send({
          data: {},
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const camp = await CampFactory.create();
      const registration = await createRegistration(camp);

      await request()
        .put(`/api/v1/camps/${camp.id}/registrations/${registration.id}`)
        .send({})
        .expect(401);
    });

    it.todo('should respond with `400` status code when request body is empty');

    it('should respond with `404` status code when registration id does not exists', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      const id = ulid();

      await request()
        .patch(`/api/v1/camps/${camp.id}/registrations/${id}`)
        .send({})
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });

    it.todo(
      'should send a confirmation to the user if the waiting list status chnages',
    );

    describe.todo('update camp data');
  });

  describe('DELETE /api/v1/camps/:campId/registrations/:registrationId', () => {
    it('should respond with `204` status code when user is camp manager', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      const registration = await createRegistration(camp);

      await request()
        .delete(`/api/v1/camps/${camp.id}/registrations/${registration.id}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(204);

      const registrationCount = await countRegistrations(camp);
      expect(registrationCount).toBe(0);
    });

    it('should respond with `403` status code when user is not camp manager', async () => {
      const camp = await CampFactory.create();
      const registration = await createRegistration(camp);
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .delete(`/api/v1/camps/${camp.id}/registrations/${registration.id}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(403);

      const registrationCount = await countRegistrations(camp);
      expect(registrationCount).toBe(1);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const camp = await CampFactory.create();
      const registration = await createRegistration(camp);

      await request()
        .delete(`/api/v1/camps/${camp.id}/registrations/${registration.id}`)
        .send()
        .expect(401);

      const registrationCount = await countRegistrations(camp);
      expect(registrationCount).toBe(1);
    });

    it('should respond with `404` status code when registration id does not exists', async () => {
      const camp = await CampFactory.create();
      const registrationId = ulid();

      await request()
        .delete(`/api/v1/camps/${camp.id}/registrations/${registrationId}`)
        .send()
        .expect(404);
    });
  });
});
