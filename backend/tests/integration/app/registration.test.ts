import { describe, expect, it } from 'vitest';
import prisma from '../utils/prisma.js';
import { generateAccessToken } from './utils/token.js';
import {
  CampFactory,
  FileFactory,
  RegistrationFactory,
  UserFactory,
  CampManagerFactory,
  MessageTemplateFactory,
} from '../../../prisma/factories/index.js';
import { Camp, Prisma } from '@prisma/client';
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
  campWithAllCampDataTypes,
  campWithRequiredField,
  campWithoutCountryData,
  campWithEmail,
  campWithMultipleEmails,
  campWithContactEmailInternational,
  campWithEmailAndMaxParticipants,
  campWithFormFunctions,
  campWithAddress,
  campWithMultipleFilesRequired,
  campWithAddressCampDataTypes,
  campWithEmailAndCountry,
  campWithEmailSingleCountry,
} from './fixtures/registration.fixtures.js';
import { request } from '../utils/request.js';
import { NoOpMailer } from '#app/mail/noop.mailer.js';
import { uploadFile } from './utils/file.js';
import { expectEmailCount, expectEmailWith } from '../utils/mail.js';

const mailer = NoOpMailer.prototype;

const createRegistrationWithFile = async () => {
  const camp = await CampFactory.create();
  const registration = await RegistrationFactory.create({
    camp: { connect: { id: camp.id } },
  });

  const fileName = crypto.randomUUID() + '.pdf';
  await uploadFile('blank.pdf', fileName);

  const file = await FileFactory.create({
    registration: { connect: { id: registration.id } },
    name: fileName,
  });

  const user = await UserFactory.create({
    campRoles: {
      create: CampManagerFactory.build({
        camp: { connect: { id: camp.id } },
      }),
    },
  });

  const accessToken = generateAccessToken(user);

  return { registration, camp, file, user, accessToken };
};

describe('/api/v1/camps/:campId/registrations', () => {
  const createCampWithManagerAndToken = async (
    campData: Partial<Prisma.CampCreateInput> = {},
    role = 'DIRECTOR',
  ) => {
    const camp = await CampFactory.create(campData);
    const user = await UserFactory.create();
    const manager = await CampManagerFactory.create({
      camp: { connect: { id: camp.id } },
      user: { connect: { id: user.id } },
      role,
    });
    const accessToken = generateAccessToken(user);

    return {
      camp,
      user,
      manager,
      accessToken,
    };
  };

  const createRegistration = async (
    camp: Camp,
    data?: Partial<Prisma.RegistrationCreateInput>,
  ) => {
    return RegistrationFactory.create({
      ...data,
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
    it.each([
      { role: 'DIRECTOR', expectedStatus: 200 },
      { role: 'COORDINATOR', expectedStatus: 200 },
      { role: 'COUNSELOR', expectedStatus: 200 },
      { role: 'VIEWER', expectedStatus: 200 },
    ])(
      'should respond with `$expectedStatus` status code when user is $role',
      async ({ role, expectedStatus }) => {
        const { camp, accessToken } = await createCampWithManagerAndToken(
          undefined,
          role,
        );
        await createRegistration(camp);

        const { body } = await request()
          .get(`/api/v1/camps/${camp.id}/registrations`)
          .send()
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);

        expect(body).toHaveProperty('data');
        expect(body.data).toHaveLength(1);

        // Additional assertions for DIRECTOR role
        if (role === 'DIRECTOR') {
          expect(body.data[0]).toHaveProperty('id');
          expect(body.data[0]).toHaveProperty('room');
        }
      },
    );

    it('should not include deleted registrations', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      await createRegistration(camp);
      await RegistrationFactory.create({
        camp: { connect: { id: camp.id } },
        deletedAt: new Date(),
      });

      const { body } = await request()
        .get(`/api/v1/camps/${camp.id}/registrations`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body).toHaveProperty('data');
      expect(body.data).toHaveLength(1);
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
    it('should respond with `200` status code', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken(
        undefined,
        'DIRECTOR',
      );
      const registration = await createRegistration(camp);

      const { body } = await request()
        .get(`/api/v1/camps/${camp.id}/registrations/${registration.id}/`)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body).toHaveProperty('data');
      const data = body.data;

      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('computedData');
      expect(data).toHaveProperty('computedData.firstName');
      expect(data).toHaveProperty('computedData.lastName');
      expect(data).toHaveProperty('computedData.dateOfBirth');
      expect(data).toHaveProperty('computedData.dateOfBirth');
      expect(data).toHaveProperty('computedData.gender');
      expect(data).toHaveProperty('computedData.address');
      expect(data).toHaveProperty('computedData.role');
      expect(data).toHaveProperty('computedData.emails');
      expect(data).toHaveProperty('customData');
      expect(data).toHaveProperty('locale');
      expect(data).toHaveProperty('room');
      expect(data).toHaveProperty('createdAt');
      expect(data).toHaveProperty('updatedAt');
    });

    it.each([
      { role: 'DIRECTOR', expectedStatus: 200 },
      { role: 'COORDINATOR', expectedStatus: 200 },
      { role: 'COUNSELOR', expectedStatus: 200 },
      { role: 'VIEWER', expectedStatus: 200 },
    ])(
      'should respond with `$expectedStatus` status code when user is $role',
      async ({ role, expectedStatus }) => {
        const { camp, accessToken } = await createCampWithManagerAndToken(
          undefined,
          role,
        );
        const registration = await createRegistration(camp);

        const { body } = await request()
          .get(`/api/v1/camps/${camp.id}/registrations/${registration.id}/`)
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);

        expect(body).toHaveProperty('data');
      },
    );

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

    it('should respond with `404` status code when user is camp manager', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      const registration = await RegistrationFactory.create({
        camp: { connect: { id: camp.id } },
        deletedAt: new Date(),
      });

      await request()
        .get(`/api/v1/camps/${camp.id}/registrations/${registration.id}/`)
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
      expect(body).toHaveProperty('data.status');
      expect(body).toHaveProperty('data.data');
      expect(body).toHaveProperty('data.data.first_name', 'Jhon');
      expect(body).toHaveProperty('data.data.last_name', 'Doe');
      expect(body).toHaveProperty('data.computedData');
      expect(body).toHaveProperty('data.customData');
      expect(body).toHaveProperty('data.locale');
      expect(body).toHaveProperty('data.room');
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

    it('should respond with `201` status code when form has camp variables', async () => {
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

    it('should respond with `201` status code when form has custom functions', async () => {
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
        const sessionId = crypto.randomUUID();
        const camp = await CampFactory.create(campWithFileRequired);
        const file = await FileFactory.create({
          field: sessionId,
          accessLevel: 'private',
        });

        const data = {
          some_field: 'Some value',
          some_file: file.id,
        };

        const { body } = await request()
          .post(`/api/v1/camps/${camp.id}/registrations`)
          .set('Cookie', [
            'session=' + sessionId,
            '__Host-session=' + sessionId,
          ])
          .send({ data })
          .expect(201);

        expect(body).toHaveProperty(`data.id`);
        expect(body).toHaveProperty(`data.data.some_file`);

        expect(body.data.data.some_file).toBe(file.id);

        const updatedFile = await prisma.file.findFirst({
          where: { id: file.id },
        });

        expect(updatedFile?.registrationId).toBe(body.data.id);
      });

      it('should respond with `201` status code when form has multiple files', async () => {
        const sessionId = crypto.randomUUID();
        const camp = await CampFactory.create(campWithMultipleFilesRequired);
        const file1 = await FileFactory.create({
          field: sessionId,
          accessLevel: 'private',
        });
        const file2 = await FileFactory.create({
          field: sessionId,
          accessLevel: 'private',
        });

        const data = {
          some_field: 'Some value',
          some_files: [file1.id, file2.id],
        };

        const { body } = await request()
          .post(`/api/v1/camps/${camp.id}/registrations`)
          .set('Cookie', [
            'session=' + sessionId,
            '__Host-session=' + sessionId,
          ])
          .send({ data })
          .expect(201);

        expect(body).toHaveProperty(`data.id`);
        expect(body).toHaveProperty(`data.data.some_files`);
        expect(body.data.data.some_files).toHaveLength(2);

        expect(body.data.data.some_files[0]).toBe(file1.id);
        expect(body.data.data.some_files[1]).toBe(file2.id);

        const updatedFiles = await prisma.file.findMany({
          where: { registrationId: body.data.id },
        });

        expect(updatedFiles).toHaveLength(2);
      });

      it('should respond with `201` status code when file is optional', async () => {
        const camp = await CampFactory.create(campWithFileOptional);

        const data = {
          some_field: 'Some value',
        };

        await request()
          .post(`/api/v1/camps/${camp.id}/registrations`)
          .send({ data })
          .expect(201);
      });

      it('should respond with `400` status code when file is missing', async () => {
        const camp = await CampFactory.create(campWithFileRequired);
        const fileId = ulid();

        const data = {
          some_field: 'Some value',
          some_file: fileId,
        };

        await request()
          .post(`/api/v1/camps/${camp.id}/registrations`)
          .send({ data })
          .expect(400);
      });

      it('should respond with `400` status code when file field is invalid', async () => {
        const sessionId = crypto.randomUUID();

        const camp = await CampFactory.create(campWithFileRequired);
        const file = await FileFactory.create({
          field: crypto.randomUUID(), // Does not match sessionId
          accessLevel: 'private',
        });

        const data = {
          some_field: 'Some value',
          some_file: file.id,
        };

        await request()
          .post(`/api/v1/camps/${camp.id}/registrations`)
          .set('Cookie', [
            'session=' + sessionId,
            '__Host-session=' + sessionId,
          ])
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
        const sessionId = crypto.randomUUID();
        const camp = await CampFactory.create(campWithFileRequired);
        const registration = await RegistrationFactory.create({
          camp: { connect: { id: camp.id } },
        });
        const file = await FileFactory.create({
          field: sessionId,
          accessLevel: 'private',
          registration: { connect: { id: registration.id } },
        });

        const data = {
          some_field: 'Some value',
          some_file: file.id,
        };

        await request()
          .post(`/api/v1/camps/${camp.id}/registrations`)
          .set('Cookie', [
            'session=' + sessionId,
            '__Host-session=' + sessionId,
          ])
          .send({ data })
          .expect(400);
      });
    });

    describe('computed data', () => {
      it('should generate computed data for all fields', async () => {
        const camp = await CampFactory.create(campWithAllCampDataTypes);

        const data = {
          firstName: 'Jhon',
          lastName: 'Doe',
          dateOfBirth: '2000-01-01',
          email: 'test@example.com',
          emailSecondary: 'other@example.com',
          role: 'counselor',
          gender: 'f',
          street: 'Somestreet 1',
          city: 'Somecity',
          zipCode: '12356',
          country: 'de',
        };

        const { body } = await request()
          .post(`/api/v1/camps/${camp.id}/registrations`)
          .send({ data })
          .expect(201);

        expect(body).toHaveProperty('data.computedData');
        expect(body.data.computedData).toEqual({
          firstName: 'Jhon',
          lastName: 'Doe',
          dateOfBirth: '2000-01-01',
          emails: ['test@example.com', 'other@example.com'],
          role: 'counselor',
          gender: 'f',
          address: {
            street: 'Somestreet 1',
            city: 'Somecity',
            zipCode: '12356',
            country: 'de',
          },
        });
      });

      it('should generate computed data with address', async () => {
        const camp = await CampFactory.create(campWithAddressCampDataTypes);

        const data = {
          address: {
            address: 'Somestreet 1',
            city: 'Somecity',
            zip_code: '12356',
            country: 'de',
          },
        };

        const { body } = await request()
          .post(`/api/v1/camps/${camp.id}/registrations`)
          .send({ data })
          .expect(201);

        expect(body).toHaveProperty('data.computedData.address');
        expect(body.data.computedData.address).toEqual({
          street: 'Somestreet 1',
          city: 'Somecity',
          zipCode: '12356',
          country: 'de',
        });
      });
    });

    describe('waiting list', () => {
      const assertRegistration = async (
        campId: string,
        data: unknown,
        expected: string,
      ) => {
        const { body } = await request()
          .post(`/api/v1/camps/${campId}/registrations`)
          .send({ data })
          .expect(201);

        expect(body).toHaveProperty('data.status', expected);
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
            'ACCEPTED',
          );
        }

        // Assert waiting list
        await assertRegistration(
          camp.id,
          {
            first_name: `Jhon`,
          },
          'WAITLISTED',
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
            'ACCEPTED',
          );
        }

        // Assert waiting list
        await assertRegistration(
          camp.id,
          {
            first_name: `Jhon`,
            country: 'de',
          },
          'WAITLISTED',
        );

        // Other nation should not be on waiting list
        await assertRegistration(
          camp.id,
          {
            first_name: `Jhon`,
            country: 'fr',
          },
          'ACCEPTED',
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
          'ACCEPTED',
        );

        // Fill camp
        for (let i = 0; i < 5; i++) {
          await assertRegistration(
            camp.id,
            {
              first_name: `Jhon ${i}`,
              role: 'participant',
            },
            'ACCEPTED',
          );
        }

        // Assert waiting list
        await assertRegistration(
          camp.id,
          {
            first_name: `Jhon`,
            role: 'participant',
          },
          'WAITLISTED',
        );

        // Check another counselor
        await assertRegistration(
          camp.id,
          {
            first_name: `Mary`,
            role: 'counselor',
          },
          'ACCEPTED',
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
          'ACCEPTED',
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
            'ACCEPTED',
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
          'WAITLISTED',
        );

        // Check another counselor
        await assertRegistration(
          camp.id,
          {
            first_name: `Mary`,
            role: 'counselor',
            country: 'de',
          },
          'ACCEPTED',
        );

        // Check participant from other nation
        await assertRegistration(
          camp.id,
          {
            first_name: `Larry`,
            role: 'participant',
            country: 'fr',
          },
          'ACCEPTED',
        );
      });

      it('should set waiting list when country is provided via address', async () => {
        const camp = await CampFactory.create(campWithAddress);

        // Fill camp
        for (let i = 0; i < 5; i++) {
          await assertRegistration(
            camp.id,
            {
              first_name: `Jhon ${i}`,
              address: {
                country: 'de',
              },
            },
            'ACCEPTED',
          );
        }

        // Assert waiting list
        await assertRegistration(
          camp.id,
          {
            first_name: `Jhon`,
            address: {
              country: 'de',
            },
          },
          'WAITLISTED',
        );

        // Other nation should not be on waiting list
        await assertRegistration(
          camp.id,
          {
            first_name: `Jhon`,
            address: {
              country: 'fr',
            },
          },
          'ACCEPTED',
        );
      });

      it('should ignore the waiting list field when set', async () => {
        const camp = await CampFactory.create(campWithMaxParticipantsNational);

        // Fill camp
        for (let i = 0; i < 5; i++) {
          await request()
            .post(`/api/v1/camps/${camp.id}/registrations`)
            .send({
              data: { first_name: `Jhon ${i}` },
              status: 'ACCEPTED',
            })
            .expect(201);
        }

        // Assert waiting list
        await assertRegistration(
          camp.id,
          {
            first_name: `Jhon`,
          },
          'WAITLISTED',
        );
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

    describe('sends messages', () => {
      it('should not send a message when message template for group is missing', async () => {
        const camp = await CampFactory.create({
          ...campWithEmailAndCountry,
          messageTemplates: {
            create: MessageTemplateFactory.build({
              event: 'registration_confirmed',
              subject: 'Registration confirmed',
              country: 'de',
            }),
          },
        });

        const data = {
          email: 'test@example.com',
          first_name: 'Jhon',
          last_name: 'Doe',
          country: 'fr',
        };

        await request()
          .post(`/api/v1/camps/${camp.id}/registrations`)
          .send({ data })
          .expect(201);
      });

      it('should send a confirmation email to the user with country', async () => {
        const camp = await CampFactory.create({
          ...campWithEmailAndCountry,
          messageTemplates: {
            create: MessageTemplateFactory.build({
              event: 'registration_confirmed',
              subject: 'Registration confirmed',
              country: 'fr',
            }),
          },
        });

        const data = {
          email: 'test@example.com',
          first_name: 'Jhon',
          last_name: 'Doe',
          country: 'fr',
        };

        await request()
          .post(`/api/v1/camps/${camp.id}/registrations`)
          .send({ data })
          .expect(201);

        expectEmailWith({
          to: data.email,
          replyTo: camp.contactEmail as string,
          subject: 'Registration confirmed',
        });
      });

      it('should send a confirmation email to the user without country in national camp', async () => {
        const camp = await CampFactory.create({
          ...campWithEmailSingleCountry,
          messageTemplates: {
            create: MessageTemplateFactory.build({
              event: 'registration_confirmed',
              subject: 'Registration confirmed',
              country: 'fr',
            }),
          },
        });

        const data = {
          email: 'test@example.com',
          first_name: 'Jhon',
          last_name: 'Doe',
        };

        await request()
          .post(`/api/v1/camps/${camp.id}/registrations`)
          .send({ data })
          .expect(201);

        expectEmailWith({
          to: data.email,
          replyTo: camp.contactEmail as string,
          subject: 'Registration confirmed',
        });
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

        expectEmailWith({
          to: data.email,
          replyTo: camp.contactEmail as string,
        });

        expectEmailWith({
          to: data.emailGuardian,
          replyTo: camp.contactEmail as string,
        });
      });

      it('should send a notification to the contact email for national camp', async () => {
        const camp = await CampFactory.create(campWithEmail);

        const data = {
          email: 'test@example.com',
          first_name: 'Jhon',
        };

        await request()
          .post(`/api/v1/camps/${camp.id}/registrations`)
          .send({ data })
          .expect(201);

        // TODO Assert correct language
        expectEmailWith({
          to: camp.contactEmail as string,
          replyTo: expect.arrayContaining([data.email]),
        });
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
        // TODO Assert correct language
        expectEmailWith({
          to: expectedEmail,
        });
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

        expectEmailWith({
          to: expect.arrayContaining(expectedEmails),
        });
      });

      it('should send a waiting list information to the user', async () => {
        const camp = await CampFactory.create({
          ...campWithEmailAndMaxParticipants,
          messageTemplates: {
            create: MessageTemplateFactory.build({
              country: 'fr',
              event: 'registration_waitlisted',
              subject: 'Registration on waiting list',
            }),
          },
        });

        const data = {
          email: 'test@example.com',
          country: 'fr',
        };

        await request()
          .post(`/api/v1/camps/${camp.id}/registrations`)
          .send({ data })
          .expect(201);

        expectEmailWith({
          to: data.email,
          subject: 'Registration on waiting list',
        });
      });
    });
  });

  describe('PATCH /api/v1/camps/:campId/registrations/:registrationId', () => {
    it.each([
      { role: 'DIRECTOR', expectedStatus: 200 },
      { role: 'COORDINATOR', expectedStatus: 200 },
      { role: 'COUNSELOR', expectedStatus: 403 },
      { role: 'VIEWER', expectedStatus: 403 },
    ])(
      'should respond with `$expectedStatus` status code when user is $role',
      async ({ role, expectedStatus }) => {
        const { camp, accessToken } = await createCampWithManagerAndToken(
          undefined,
          role,
        );
        const registration = await createRegistration(camp);

        await request()
          .patch(`/api/v1/camps/${camp.id}/registrations/${registration.id}`)
          .send({
            status: 'ACCEPTED',
          })
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);
      },
    );

    it('should respond with `403` status code when user is not camp manager', async () => {
      const accessToken = generateAccessToken(await UserFactory.create());
      const camp = await CampFactory.create();
      const registration = await createRegistration(camp);

      await request()
        .patch(`/api/v1/camps/${camp.id}/registrations/${registration.id}`)
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
        .patch(`/api/v1/camps/${camp.id}/registrations/${registration.id}`)
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

    it('should respond with `404` status code when user is camp manager', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      const registration = await RegistrationFactory.create({
        camp: { connect: { id: camp.id } },
        deletedAt: new Date(),
      });

      await request()
        .patch(`/api/v1/camps/${camp.id}/registrations/${registration.id}`)
        .send({})
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });

    describe('files', () => {
      it('should respond with `200` status code when previous form has file', async () => {
        const { camp, accessToken } =
          await createCampWithManagerAndToken(campWithFileRequired);
        const file = await FileFactory.create({
          field: crypto.randomUUID(),
          accessLevel: 'private',
        });
        const registration = await createRegistration(camp, {
          data: {
            some_field: 'Test',
            some_file: file.id,
          },
          files: { connect: { id: file.id } },
        });

        const { body } = await request()
          .patch(`/api/v1/camps/${camp.id}/registrations/${registration.id}`)
          .send({
            data: {
              some_field: 'Test',
              some_file: file.id,
            },
          })
          .auth(accessToken, { type: 'bearer' })
          .expect(200);

        expect(body.data.data).toHaveProperty('some_field', 'Test');
        expect(body.data.data).toHaveProperty('some_file', file.id);

        const files = await prisma.file.findMany({
          where: {
            registrationId: registration.id,
          },
        });

        expect(files).toHaveLength(1);
        expect(files[0].id).toBe(file.id);
      });

      it('should respond with `200` status code when new file is provided', async () => {
        const sessionId = crypto.randomUUID();
        const { camp, accessToken } =
          await createCampWithManagerAndToken(campWithFileOptional);
        const registration = await createRegistration(camp, {
          data: {
            some_field: 'Test',
          },
        });

        const file = await FileFactory.create({
          field: sessionId,
          accessLevel: 'private',
        });

        const { body } = await request()
          .patch(`/api/v1/camps/${camp.id}/registrations/${registration.id}`)
          .set('Cookie', [
            'session=' + sessionId,
            '__Host-session=' + sessionId,
          ])
          .send({
            data: {
              some_field: 'Test',
              some_file: file.id,
            },
          })
          .auth(accessToken, { type: 'bearer' })
          .expect(200);

        expect(body.data.data).toHaveProperty('some_field', 'Test');
        expect(body.data.data).toHaveProperty('some_file', file.id);

        const files = await prisma.file.findMany({
          where: {
            registrationId: registration.id,
          },
        });

        expect(files).toHaveLength(1);
        expect(files[0].id).toBe(file.id);
      });

      it('should respond with `200` status code when new file is replaced', async () => {
        const sessionId = crypto.randomUUID();
        const { camp, accessToken } =
          await createCampWithManagerAndToken(campWithFileRequired);
        const oldFile = await FileFactory.create({
          field: crypto.randomUUID(),
          accessLevel: 'private',
        });
        const registration = await createRegistration(camp, {
          data: {
            some_field: 'Test',
            some_file: oldFile.id,
          },
          files: { connect: { id: oldFile.id } },
        });
        const file = await FileFactory.create({
          field: sessionId,
          accessLevel: 'private',
        });

        const { body } = await request()
          .patch(`/api/v1/camps/${camp.id}/registrations/${registration.id}`)
          .set('Cookie', [
            'session=' + sessionId,
            '__Host-session=' + sessionId,
          ])
          .send({
            data: {
              some_field: 'Test',
              some_file: file.id,
            },
          })
          .auth(accessToken, { type: 'bearer' })
          .expect(200);

        expect(body.data.data).toHaveProperty('some_field', 'Test');
        expect(body.data.data).toHaveProperty('some_file', file.id);

        const files = await prisma.file.findMany({
          where: {
            registrationId: registration.id,
          },
        });

        expect(files).toHaveLength(1);
        expect(files[0].id).toBe(file.id);
      });

      it('should respond with `400` status code when file does not exist', async () => {
        const sessionId = crypto.randomUUID();
        const { camp, accessToken } =
          await createCampWithManagerAndToken(campWithFileOptional);
        const registration = await createRegistration(camp, {
          data: {
            some_field: 'Test',
          },
        });

        await request()
          .patch(`/api/v1/camps/${camp.id}/registrations/${registration.id}`)
          .set('Cookie', [
            'session=' + sessionId,
            '__Host-session=' + sessionId,
          ])
          .send({
            data: {
              some_field: 'Test',
              some_file: ulid(),
            },
          })
          .auth(accessToken, { type: 'bearer' })
          .expect(400);
      });

      it('should respond with `400` status code when session id does not match', async () => {
        const sessionId = crypto.randomUUID();
        const { camp, accessToken } =
          await createCampWithManagerAndToken(campWithFileOptional);
        const registration = await createRegistration(camp, {
          data: {
            some_field: 'Test',
          },
        });

        const file = await FileFactory.create({
          field: crypto.randomUUID(),
          accessLevel: 'private',
        });

        await request()
          .patch(`/api/v1/camps/${camp.id}/registrations/${registration.id}`)
          .set('Cookie', [
            'session=' + sessionId,
            '__Host-session=' + sessionId,
          ])
          .send({
            data: {
              some_field: 'Test',
              some_file: file.id,
            },
          })
          .auth(accessToken, { type: 'bearer' })
          .expect(400);
      });

      it('should respond with `400` status code when file is already assigned', async () => {
        const sessionId = crypto.randomUUID();
        const { camp, accessToken } =
          await createCampWithManagerAndToken(campWithFileOptional);
        const registration = await createRegistration(camp, {
          data: {
            some_field: 'Test',
          },
        });

        const file = await FileFactory.create({
          field: sessionId,
          accessLevel: 'private',
          registration: {
            create: RegistrationFactory.build({
              camp: { create: CampFactory.build() },
            }),
          },
        });

        await request()
          .patch(`/api/v1/camps/${camp.id}/registrations/${registration.id}`)
          .set('Cookie', [
            'session=' + sessionId,
            '__Host-session=' + sessionId,
          ])
          .send({
            data: {
              some_field: 'Test',
              some_file: file.id,
            },
          })
          .auth(accessToken, { type: 'bearer' })
          .expect(400);
      });
    });

    describe('sends messages', () => {
      it('should respond with `200` status code when message template is missing', async () => {
        const { camp, accessToken } = await createCampWithManagerAndToken({
          ...campWithEmail,
          messageTemplates: {},
        });
        const registration = await createRegistration(camp);

        const data = {
          email: 'test@example.com',
          first_name: 'Jhon',
          last_name: 'Doe',
        };

        await request()
          .patch(`/api/v1/camps/${camp.id}/registrations/${registration.id}`)
          .send({ data })
          .auth(accessToken, { type: 'bearer' })
          .expect(200);
      });

      it('should send update email', async () => {
        const { camp, accessToken } = await createCampWithManagerAndToken({
          ...campWithEmail,
          messageTemplates: {
            create: MessageTemplateFactory.build({
              event: 'registration_updated',
              subject: 'Registration updated',
            }),
          },
        });
        const registration = await createRegistration(camp);

        const data = {
          email: 'test@example.com',
          first_name: 'Jhon',
          last_name: 'Doe',
        };

        await request()
          .patch(`/api/v1/camps/${camp.id}/registrations/${registration.id}`)
          .send({ data })
          .auth(accessToken, { type: 'bearer' })
          .expect(200);

        expectEmailWith({
          to: data.email,
          replyTo: camp.contactEmail as string,
          subject: 'Registration updated',
        });
      });

      it('should not send update email when suppressed', async () => {
        const { camp, accessToken } = await createCampWithManagerAndToken({
          ...campWithEmail,
          messageTemplates: {
            create: MessageTemplateFactory.build({
              event: 'registration_updated',
              country: 'fr',
              subject: 'Registration updated',
            }),
          },
        });
        const registration = await createRegistration(camp, {
          country: 'bg',
        });

        const data = {
          email: 'test@example.com',
          first_name: 'Jhon',
          last_name: 'Doe',
        };

        await request()
          .patch(
            `/api/v1/camps/${camp.id}/registrations/${registration.id}?suppressMessage=true`,
          )
          .send({ data })
          .auth(accessToken, { type: 'bearer' })
          .expect(200);

        expectEmailCount(0);
      });

      it('should send waiting list confirmation', async () => {
        const { camp, accessToken } = await createCampWithManagerAndToken({
          ...campWithEmailAndCountry,
          messageTemplates: {
            create: MessageTemplateFactory.build({
              event: 'registration_waitlist_accepted',
              country: 'fr',
              subject: 'Registration accepted',
            }),
          },
        });
        const registration = await createRegistration(camp, {
          status: 'WAITLISTED',
          country: 'fr',
        });

        const data = {
          email: 'test@example.com',
          first_name: 'Jhon',
          last_name: 'Doe',
          country: 'fr',
        };

        await request()
          .patch(`/api/v1/camps/${camp.id}/registrations/${registration.id}`)
          .send({
            status: 'ACCEPTED',
            data,
          })
          .auth(accessToken, { type: 'bearer' })
          .expect(200);

        expectEmailCount(1);
        expectEmailWith({
          to: data.email,
          replyTo: camp.contactEmail as string,
          subject: 'Registration accepted',
        });
      });
    });

    describe('computed data', () => {
      it('should generate computed data for all fields', async () => {
        const { camp, accessToken } = await createCampWithManagerAndToken(
          campWithAllCampDataTypes,
        );
        const registration = await createRegistration(camp);

        const data = {
          firstName: 'Jhon',
          lastName: 'Doe',
          dateOfBirth: '2000-01-01',
          email: 'test@example.com',
          emailSecondary: 'other@example.com',
          role: 'counselor',
          gender: 'f',
          street: 'Somestreet 1',
          city: 'Somecity',
          zipCode: '12356',
          country: 'de',
        };

        const { body } = await request()
          .patch(`/api/v1/camps/${camp.id}/registrations/${registration.id}`)
          .send({ data })
          .auth(accessToken, { type: 'bearer' })
          .expect(200);

        expect(body).toHaveProperty('data.computedData');
        expect(body.data.computedData).toEqual({
          firstName: 'Jhon',
          lastName: 'Doe',
          dateOfBirth: '2000-01-01',
          emails: ['test@example.com', 'other@example.com'],
          role: 'counselor',
          gender: 'f',
          address: {
            street: 'Somestreet 1',
            city: 'Somecity',
            zipCode: '12356',
            country: 'de',
          },
        });
      });

      it('should generate computed data with address', async () => {
        const { camp, accessToken } = await createCampWithManagerAndToken(
          campWithAddressCampDataTypes,
        );
        const registration = await createRegistration(camp);

        const data = {
          address: {
            address: 'Somestreet 1',
            city: 'Somecity',
            zip_code: '12356',
            country: 'de',
          },
        };

        const { body } = await request()
          .patch(`/api/v1/camps/${camp.id}/registrations/${registration.id}`)
          .send({ data })
          .auth(accessToken, { type: 'bearer' })
          .expect(200);

        expect(body).toHaveProperty('data.computedData.address');
        expect(body.data.computedData.address).toEqual({
          street: 'Somestreet 1',
          city: 'Somecity',
          zipCode: '12356',
          country: 'de',
        });
      });
    });

    describe('custom data', () => {
      it('should respond with `200` status code when custom data is present', async () => {
        const { camp, accessToken } = await createCampWithManagerAndToken(
          undefined,
          'DIRECTOR',
        );
        const registration = await createRegistration(camp);

        const customData = {
          someKey: 'someValue',
          anotherKey: 123,
        };

        const { body } = await request()
          .patch(`/api/v1/camps/${camp.id}/registrations/${registration.id}`)
          .send({
            customData,
          })
          .auth(accessToken, { type: 'bearer' })
          .expect(200);

        expect(body).toHaveProperty('data.customData', {
          someKey: 'someValue',
          anotherKey: 123,
        });
      });

      it('should respond with `200` status code when custom data is overwritten', async () => {
        const { camp, accessToken } = await createCampWithManagerAndToken(
          undefined,
          'DIRECTOR',
        );
        const registration = await createRegistration(camp);

        const customData = {
          someKey: 'someValue',
          anotherKey: 123,
        };

        await request()
          .patch(`/api/v1/camps/${camp.id}/registrations/${registration.id}`)
          .send({
            customData,
          })
          .auth(accessToken, { type: 'bearer' })
          .expect(200);

        const updatedCustomData = {
          someKey: 'newValue',
        };

        const { body } = await request()
          .patch(`/api/v1/camps/${camp.id}/registrations/${registration.id}`)
          .send({
            customData: updatedCustomData,
          })
          .auth(accessToken, { type: 'bearer' })
          .expect(200);

        expect(body).toHaveProperty('data.customData', {
          someKey: 'newValue',
        });
      });

      it('should respond with `400` status code when custom data is invalid', async () => {
        const { camp, accessToken } = await createCampWithManagerAndToken(
          undefined,
          'DIRECTOR',
        );
        const registration = await createRegistration(camp);

        const customData = 'Invalid custom data';

        await request()
          .patch(`/api/v1/camps/${camp.id}/registrations/${registration.id}`)
          .send({
            customData,
          })
          .auth(accessToken, { type: 'bearer' })
          .expect(400);
      });
    });
  });

  describe('DELETE /api/v1/camps/:campId/registrations/:registrationId', () => {
    it.each([
      { role: 'DIRECTOR', expectedStatus: 204, expectedCount: 1 },
      { role: 'COORDINATOR', expectedStatus: 204, expectedCount: 1 },
      { role: 'COUNSELOR', expectedStatus: 403, expectedCount: 2 },
      { role: 'VIEWER', expectedStatus: 403, expectedCount: 2 },
    ])(
      'should respond with `$expectedStatus` status code when user is $role',
      async ({ role, expectedStatus, expectedCount }) => {
        const { camp, accessToken } = await createCampWithManagerAndToken(
          undefined,
          role,
        );
        await createRegistration(camp);
        const registration = await createRegistration(camp);

        await request()
          .delete(`/api/v1/camps/${camp.id}/registrations/${registration.id}`)
          .send()
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);

        const registrationCount = await prisma.registration.count({
          where: {
            campId: camp.id,
            deletedAt: null,
          },
        });
        expect(registrationCount).toBe(expectedCount);
      },
    );

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

    describe('sends messages', () => {
      it('should respond with `204` status code when message template is missing', async () => {
        const { camp, accessToken } = await createCampWithManagerAndToken({
          messageTemplates: {},
        });
        const registration = await RegistrationFactory.create({
          camp: { connect: { id: camp.id } },
          emails: ['test@email.com'],
        });

        await request()
          .delete(`/api/v1/camps/${camp.id}/registrations/${registration.id}`)
          .send()
          .auth(accessToken, { type: 'bearer' })
          .expect(204);
      });

      it('should send update email', async () => {
        const { camp, accessToken } = await createCampWithManagerAndToken({
          ...campWithEmail,
          messageTemplates: {
            createMany: {
              data: [
                MessageTemplateFactory.build({
                  event: 'registration_canceled',
                  country: 'us',
                  subject: 'Oops',
                }),
                MessageTemplateFactory.build({
                  event: 'registration_canceled',
                  country: 'fr',
                  subject: 'Registration canceled',
                }),
              ],
            },
          },
        });
        const registration = await RegistrationFactory.create({
          camp: { connect: { id: camp.id } },
          emails: ['test@email.com'],
          country: 'fr',
        });
        await request()
          .delete(`/api/v1/camps/${camp.id}/registrations/${registration.id}`)
          .send()
          .auth(accessToken, { type: 'bearer' })
          .expect(204);

        expect(mailer.sendMail).toHaveBeenCalledWith(
          expect.objectContaining({
            to: 'test@email.com',
            replyTo: camp.contactEmail,
            subject: 'Registration canceled',
          }),
        );
      });

      it('should not send email when suppressed', async () => {
        const { camp, accessToken } = await createCampWithManagerAndToken({
          ...campWithEmail,
          messageTemplates: {
            create: MessageTemplateFactory.build({
              event: 'registration_canceled',
              subject: 'Registration canceled',
              country: 'fr',
            }),
          },
        });
        const registration = await RegistrationFactory.create({
          camp: { connect: { id: camp.id } },
          emails: ['test@email.com'],
          country: 'fr',
        });
        await request()
          .delete(
            `/api/v1/camps/${camp.id}/registrations/${registration.id}?suppressMessage=true`,
          )
          .send()
          .auth(accessToken, { type: 'bearer' })
          .expect(204);

        expect(mailer.sendMail).not.toHaveBeenCalledWith(
          expect.objectContaining({
            to: 'test@email.com',
            replyTo: camp.contactEmail,
            subject: 'Registration canceled',
          }),
        );
      });
    });
  });
});

describe('/api/v1/files/', () => {
  describe('GET /api/v1/files/:fileId', () => {
    it('should respond with `200` status code when user is camp manager', async () => {
      const { file, accessToken } = await createRegistrationWithFile();

      await request()
        .get(`/api/v1/files/${file.id}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(200);
    });

    it('should respond with `403` status code when user is not camp manager', async () => {
      const { file } = await createRegistrationWithFile();
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .get(`/api/v1/files/${file.id}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const { file } = await createRegistrationWithFile();

      await request().get(`/api/v1/files/${file.id}`).send().expect(401);
    });

    it('should respond with `404` status code when file id does not exists', async () => {
      const fileId = ulid();

      await request().get(`/api/v1/files/${fileId}`).send().expect(404);
    });
  });
});
