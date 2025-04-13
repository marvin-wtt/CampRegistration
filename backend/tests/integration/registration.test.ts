import { describe, expect, it } from 'vitest';
import prisma from '../utils/prisma';
import { generateAccessToken } from '../utils/token';
import {
  CampFactory,
  FileFactory,
  RegistrationFactory,
  UserFactory,
  CampManagerFactory,
  MessageTemplateFactory,
} from '../../prisma/factories';
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
} from '../fixtures/registration/camp.fixtures';
import { request } from '../utils/request';
import { NoOpMailer } from '../../src/core/mail/noop.mailer';

const mailer = NoOpMailer.prototype;

describe('/api/v1/camps/:campId/registrations', () => {
  const createCampWithManagerAndToken = async (
    campData: Partial<Prisma.CampCreateInput> = {},
  ) => {
    const camp = await CampFactory.create(campData);
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

      it('should respond with `201` status code when form has multiple files', async () => {
        const camp = await CampFactory.create(campWithMultipleFilesRequired);
        const file1 = await FileFactory.create({
          field: crypto.randomUUID(),
          accessLevel: 'private',
        });
        const file2 = await FileFactory.create({
          field: crypto.randomUUID(),
          accessLevel: 'private',
        });

        const data = {
          some_field: 'Some value',
          some_files: [
            `${file1.id}#${file1.field}`,
            `${file2.id}#${file2.field}`,
          ],
        };

        const { body } = await request()
          .post(`/api/v1/camps/${camp.id}/registrations`)
          .send({ data })
          .expect(201);

        expect(body).toHaveProperty(`data.id`);
        expect(body).toHaveProperty(`data.data.some_files`);
        expect(body.data.data.some_files).toHaveLength(2);

        const expectedUrl = (fileId: string) =>
          `/api/v1/camps/${camp.id}/registrations/${body.data.id}/files/${fileId}/`;

        expect(
          body.data.data.some_files[0].endsWith(expectedUrl(file1.id)),
        ).toBeTruthy();
        expect(
          body.data.data.some_files[1].endsWith(expectedUrl(file2.id)),
        ).toBeTruthy();

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
        const registration = await RegistrationFactory.create({
          camp: { connect: { id: camp.id } },
        });
        const file = await FileFactory.create({
          field: crypto.randomUUID(),
          accessLevel: 'private',
          registration: { connect: { id: registration.id } },
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
            false,
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
          true,
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
          false,
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
              waitingList: false,
            })
            .expect(201);
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
      it('should respond with 201 status code when message template is missing', async () => {
        const camp = await CampFactory.create({
          ...campWithEmail,
          messageTemplates: {},
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
      });

      it('should send a confirmation email to the user', async () => {
        const camp = await CampFactory.create({
          ...campWithEmail,
          messageTemplates: {
            create: MessageTemplateFactory.build({
              event: 'registration_confirmed',
              subject: {
                en: 'Registration confirmed',
                es: 'Something in spanish',
              },
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

        expect(mailer.sendMail).toHaveBeenCalledWith(
          expect.objectContaining({
            to: data.email,
            replyTo: camp.contactEmail,
            subject: 'Registration confirmed',
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
            to: data.email,
            replyTo: camp.contactEmail,
          }),
        );

        expect(mailer.sendMail).toHaveBeenCalledWith(
          expect.objectContaining({
            to: data.emailGuardian,
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

        // TODO Assert correct language
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
        // TODO Assert correct language
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
        const camp = await CampFactory.create({
          ...campWithEmailAndMaxParticipants,
          messageTemplates: {
            create: MessageTemplateFactory.build({
              event: 'registration_waitlisted',
              subject: {
                en: 'Registration on waiting list',
                es: 'Something in spanish',
              },
            }),
          },
        });

        const data = {
          email: 'test@example.com',
        };

        await request()
          .post(`/api/v1/camps/${camp.id}/registrations`)
          .send({ data })
          .expect(201);

        expect(mailer.sendMail).toHaveBeenCalledWith(
          expect.objectContaining({
            to: data.email,
            subject: 'Registration on waiting list',
          }),
        );
      });
    });
  });

  describe('PATCH /api/v1/camps/:campId/registrations/:registrationId', () => {
    it.todo('should respond with `200` status code when user is camp manager');

    it('should respond with `200` status when waiting list is updated', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      const registration = await createRegistration(camp);

      await request()
        .patch(`/api/v1/camps/${camp.id}/registrations/${registration.id}`)
        .send({
          waitingList: false,
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);
    });

    it.todo('should not overwrite camp data when updating waiting list');

    it.todo('should upload files if attached');

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

        expect(mailer.sendMail).toHaveBeenCalledWith(
          expect.objectContaining({
            to: data.email,
            replyTo: camp.contactEmail,
            subject: 'Registration updated',
          }),
        );
      });

      it('should send waiting list confirmation', async () => {
        const { camp, accessToken } = await createCampWithManagerAndToken({
          ...campWithEmail,
          messageTemplates: {
            create: MessageTemplateFactory.build({
              event: 'registration_waitlist_accepted',
              subject: 'Registration accepted',
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
          .send({
            waitingList: false,
            data,
          })
          .auth(accessToken, { type: 'bearer' })
          .expect(200);

        expect(mailer.sendMail).toHaveBeenCalledWith(
          expect.objectContaining({
            to: data.email,
            replyTo: camp.contactEmail,
            subject: 'Registration accepted',
          }),
        );
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
  });

  describe('DELETE /api/v1/camps/:campId/registrations/:registrationId', () => {
    it('should respond with `204` status code when user is camp manager', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      await createRegistration(camp);
      const registration = await createRegistration(camp);

      await request()
        .delete(`/api/v1/camps/${camp.id}/registrations/${registration.id}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(204);

      const registrationCount = await prisma.registration.count({
        where: {
          campId: camp.id,
          deletedAt: null,
        },
      });
      expect(registrationCount).toBe(1);
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
            create: MessageTemplateFactory.build({
              event: 'registration_canceled',
              subject: 'Registration canceled',
            }),
          },
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

        expect(mailer.sendMail).toHaveBeenCalledWith(
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

describe('/api/v1/camps/:campId/registrations/:registrationId/files/', () => {
  const createRegistrationWithFile = async () => {
    const camp = await CampFactory.create();
    const registration = await RegistrationFactory.create({
      camp: { connect: { id: camp.id } },
    });
    const file = await FileFactory.create({
      registration: { connect: { id: registration.id } },
    });
    const user = await UserFactory.create({
      camps: { create: { campId: camp.id } },
    });

    const accessToken = generateAccessToken(await UserFactory.create());

    return { registration, camp, file, user, accessToken };
  };

  describe('GET /api/v1/camps/:campId/registrations/:registrationId/files/:fileId', () => {
    it.todo('should respond with `200` status code');

    it('should respond with `403` status code when user is not camp manager', async () => {
      const { registration, camp, file } = await createRegistrationWithFile();
      const { accessToken } = await createRegistrationWithFile();

      await request()
        .get(
          `/api/v1/camps/${camp.id}/registrations/${registration.id}/files/${file.id}`,
        )
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const { registration, camp, file } = await createRegistrationWithFile();

      await request()
        .get(
          `/api/v1/camps/${camp.id}/registrations/${registration.id}/files/${file.id}`,
        )
        .send()
        .expect(401);
    });

    it('should respond with `404` status code when registration id does not exists', async () => {
      const { camp, file, accessToken } = await createRegistrationWithFile();
      const registrationId = ulid();

      await request()
        .get(
          `/api/v1/camps/${camp.id}/registrations/${registrationId}/files/${file.id}`,
        )
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });

    it('should respond with `404` status code when file id does not exists', async () => {
      const { camp, registration, accessToken } =
        await createRegistrationWithFile();
      const fileId = ulid();

      await request()
        .get(
          `/api/v1/camps/${camp.id}/registrations/${registration.id}/files/${fileId}`,
        )
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });
  });
});
