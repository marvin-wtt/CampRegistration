import { describe, expect, it } from 'vitest';
import prisma from '../utils/prisma';
import { generateAccessToken } from '../utils/token';
import {
  CampFactory,
  UserFactory,
  CampManagerFactory,
  RegistrationFactory,
  TableTemplateFactory,
  FileFactory,
  MessageTemplateFactory,
} from '../../prisma/factories';
import { Camp, Prisma } from '@prisma/client';
import moment from 'moment';
import { ulid } from 'ulidx';
import {
  campActivePrivate,
  campActivePublic,
  campCreateInternational,
  campCreatedBody,
  campCreateNational,
  campInactive,
  campUpdateBody,
} from '../fixtures/camp/camp.fixtures';
import { request } from '../utils/request';
import { campWithMaxParticipantsRolesInternational } from '../fixtures/registration/camp.fixtures';
import { uploadFile } from '../utils/file';

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

type CampCreateData = PartialBy<
  Prisma.CampCreateInput,
  'id' | 'form' | 'themes'
>;

const assertCampModel = async (id: string, data: CampCreateData) => {
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
    organizer: data.organizer,
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const assertCampResponseBody = (data: CampCreateData, body: any) => {
  expect(body).toHaveProperty('data');

  expect(body.data).toEqual({
    id: data.id ?? expect.anything(),
    active: data.active,
    public: data.public,
    countries: data.countries,
    name: data.name,
    organizer: data.organizer,
    contactEmail: data.contactEmail,
    maxParticipants: data.maxParticipants,
    minAge: data.minAge,
    maxAge: data.maxAge,
    startAt: data.startAt,
    endAt: data.endAt,
    price: data.price,
    location: data.location,
    freePlaces: data.maxParticipants,
    form: data.form ?? expect.anything(),
    themes: data.themes ?? expect.anything(),
  });
};

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

const createCampWithFileAndToken = async (
  accessLevel: string = 'private',
  campActive: boolean = false,
) => {
  const { camp, user, manager, accessToken } =
    await createCampWithManagerAndToken({
      active: campActive,
    });
  const fileName = crypto.randomUUID() + '.pdf';

  const file = await FileFactory.create({
    camp: { connect: { id: camp.id } },
    name: fileName,
    accessLevel,
  });

  await uploadFile('blank.pdf', fileName);

  return {
    camp,
    user,
    manager,
    file,
    accessToken,
  };
};

describe('/api/v1/camps', () => {
  describe('GET /api/v1/camps', () => {
    it('should respond with `200` status code', async () => {
      await CampFactory.create(campActivePublic);

      await request().get(`/api/v1/camps/`).send().expect(200);
    });

    it('should show all public camps', async () => {
      await CampFactory.create(campActivePublic);
      await CampFactory.create(campActivePublic);

      const { body } = await request().get(`/api/v1/camps/`).send().expect(200);

      expect(body).toHaveProperty('data');
      expect(body.data.length).toBe(2);
    });

    it('should only include active camps', async () => {
      await CampFactory.create(campActivePublic);
      await CampFactory.create(campInactive);

      const { body } = await request().get(`/api/v1/camps/`).send();

      expect(body).toHaveProperty('data');
      expect(body.data.length).toBe(1);
    });

    it('should calculate free places', async () => {
      const campA = await CampFactory.create({
        ...campActivePublic,
        maxParticipants: 10,
      });
      const campB = await CampFactory.create({
        ...campActivePublic,
        countries: ['de', 'fr'],
        maxParticipants: {
          de: 10,
          fr: 5,
        },
      });

      // Create registrations
      await RegistrationFactory.create({
        camp: { connect: { id: campA.id } },
        role: 'participant',
      });
      await RegistrationFactory.create({
        camp: { connect: { id: campA.id } },
        role: 'participant',
      });

      await RegistrationFactory.create({
        camp: { connect: { id: campB.id } },
        role: 'participant',
        country: 'fr',
      });

      const { body } = await request().get(`/api/v1/camps/`).send();

      expect(body).toHaveProperty('data');
      expect(body.data.length).toBe(2);

      const campResultA = body.data.find((v) => v.id === campA.id);
      expect(campResultA).toHaveProperty('freePlaces', 8);

      const campResultB = body.data.find((v) => v.id === campB.id);
      expect(campResultB).toHaveProperty('freePlaces.de', 10);
      expect(campResultB).toHaveProperty('freePlaces.fr', 4);
    });

    describe('query', () => {
      it('should respond with all camps if showAll is true and user is admin', async () => {
        await CampFactory.create(campActivePublic);
        await CampFactory.create(campActivePrivate);
        await CampFactory.create(campInactive);

        const user = await UserFactory.create({
          role: 'ADMIN',
        });
        const accessToken = generateAccessToken(user);

        const { body } = await request()
          .get(`/api/v1/camps/`)
          .query({
            showAll: true,
          })
          .auth(accessToken, { type: 'bearer' })
          .send()
          .expect(200);

        expect(body).toHaveProperty('data');
        expect(body.data.length).toBe(3);
      });

      it('should respond with `401` status code when showAll is set and user is unauthenticated', async () => {
        await CampFactory.create(campActivePublic);
        await CampFactory.create(campActivePrivate);
        await CampFactory.create(campInactive);

        await request()
          .get(`/api/v1/camps/`)
          .query({
            showAll: true,
          })
          .send()
          .expect(401);
      });

      it('should respond with `403` status code when showAll is set and user is not an admin', async () => {
        await CampFactory.create(campActivePublic);
        await CampFactory.create(campActivePrivate);
        await CampFactory.create(campInactive);

        const user = await UserFactory.create();
        const accessToken = generateAccessToken(user);

        await request()
          .get(`/api/v1/camps/`)
          .query({
            showAll: true,
          })
          .auth(accessToken, { type: 'bearer' })
          .send()
          .expect(403);
      });

      it.skip('should filter by name', async () => {
        await CampFactory.create({
          ...campActivePublic,
          name: 'TestCamp',
        });
        await CampFactory.create({
          ...campActivePublic,
          name: {
            de: 'TestCampDE',
            en: 'TestCampEN',
          },
        });
        await CampFactory.create({
          ...campActivePublic,
          name: 'OtherCamp',
        });
        await CampFactory.create({
          ...campActivePublic,
          name: {
            de: 'OtherCampDE',
            en: 'OtherCampEN',
          },
        });

        const { status, body } = await request()
          .get(`/api/v1/camps/`)
          .query({
            name: 'Test',
          })
          .send();

        expect(status).toBe(200);

        expect(body).toHaveProperty('data');
        expect(body.data.length).toBe(2);
      });

      it.todo('should filter by age');

      it.todo('should filter by country');

      it.todo('should filter by startAt');

      it.todo('should filter by endAt');
    });
  });

  describe('GET /api/v1/camps/:campId', () => {
    it('should respond with `200` status code when camp is public', async () => {
      const camp = await CampFactory.create({
        active: true,
        public: true,
      });

      const { body } = await request()
        .get(`/api/v1/camps/${camp.id}`)
        .send()
        .expect(200);

      expect(body).toHaveProperty('data');
      expect(body.data).toEqual({
        id: camp.id,
        active: camp.active,
        public: camp.public,
        countries: camp.countries,
        name: camp.name,
        organizer: camp.organizer,
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

    it('should respond with `200` status code when camp is private', async () => {
      const camp = await CampFactory.create({
        active: true,
        public: false,
      });

      await request().get(`/api/v1/camps/${camp.id}`).send().expect(200);
    });

    describe('free places', () => {
      it('should calculate free places for national camps', async () => {
        const camp = await CampFactory.create({
          ...campActivePublic,
          maxParticipants: 10,
        });

        // Create registrations
        await RegistrationFactory.create({
          camp: { connect: { id: camp.id } },
          role: 'participant',
        });
        await RegistrationFactory.create({
          camp: { connect: { id: camp.id } },
          role: 'participant',
        });
        await RegistrationFactory.create({
          camp: { connect: { id: camp.id } },
          role: 'counselor',
        });

        const { body } = await request()
          .get(`/api/v1/camps/${camp.id}`)
          .send()
          .expect(200);

        expect(body).toHaveProperty('data');
        expect(body.data).toHaveProperty('freePlaces', 8);
        expect(body.data).toHaveProperty('maxParticipants', 10);
      });

      it('should calculate free places for international camps', async () => {
        const camp = await CampFactory.create({
          ...campActivePublic,
          countries: ['de', 'fr'],
          maxParticipants: {
            de: 8,
            fr: 6,
          },
        });

        // Create registrations
        await RegistrationFactory.create({
          camp: { connect: { id: camp.id } },
          role: 'participant',
          country: 'de',
        });
        await RegistrationFactory.create({
          camp: { connect: { id: camp.id } },
          role: 'participant',
          country: 'fr',
        });
        await RegistrationFactory.create({
          camp: { connect: { id: camp.id } },
          role: 'counselor',
          country: 'fr',
        });

        const { body } = await request()
          .get(`/api/v1/camps/${camp.id}`)
          .send()
          .expect(200);

        expect(body).toHaveProperty('data');
        expect(body.data).toHaveProperty('freePlaces.de', 7);
        expect(body.data).toHaveProperty('freePlaces.fr', 5);
        expect(body.data).toHaveProperty('maxParticipants.de', 8);
        expect(body.data).toHaveProperty('maxParticipants.fr', 6);
      });

      it('should ignore deleted registrations', async () => {
        const camp = await CampFactory.create({
          ...campActivePublic,
          countries: ['de', 'fr'],
          maxParticipants: {
            de: 8,
            fr: 6,
          },
        });

        // Create registrations
        await RegistrationFactory.create({
          camp: { connect: { id: camp.id } },
          role: 'participant',
          country: 'fr',
          deletedAt: new Date(),
        });
        await RegistrationFactory.create({
          camp: { connect: { id: camp.id } },
          role: 'participant',
          country: 'fr',
        });

        const { body } = await request()
          .get(`/api/v1/camps/${camp.id}`)
          .send()
          .expect(200);

        expect(body).toHaveProperty('data');
        expect(body.data).toHaveProperty('freePlaces.de', 8);
        expect(body.data).toHaveProperty('freePlaces.fr', 5);
      });
    });

    it.each([
      { role: 'DIRECTOR', expectedStatus: 200 },
      { role: 'COORDINATOR', expectedStatus: 200 },
      { role: 'COUNSELOR', expectedStatus: 200 },
      { role: 'VIEWER', expectedStatus: 200 },
    ])(
      'should respond with `$expectedStatus` status code when camp is not active and user is $role',
      async ({ role, expectedStatus }) => {
        const camp = await CampFactory.create({
          active: false,
        });
        const user = await UserFactory.create();
        await CampManagerFactory.create({
          camp: { connect: { id: camp.id } },
          user: { connect: { id: user.id } },
          role,
        });
        const accessToken = generateAccessToken(user);

        await request()
          .get(`/api/v1/camps/${camp.id}`)
          .send()
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);
      },
    );

    it('should respond with `401` status code when camp is not active and user is unauthenticated', async () => {
      const camp = await CampFactory.create({
        active: false,
      });

      await request().get(`/api/v1/camps/${camp.id}`).send().expect(401);
    });

    it('should respond with `403` status code when camp is not active and user is not a manager', async () => {
      const camp = await CampFactory.create({
        active: false,
      });
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .get(`/api/v1/camps/${camp.id}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `404` status code when camp id does not exists', async () => {
      const campId = ulid();

      await request().get(`/api/v1/camps/${campId}`).send().expect(404);
    });
  });

  describe('POST /api/v1/camps', () => {
    const assertCampCreated = async (
      expected: CampCreateData,
      actual: unknown,
    ) => {
      // Test response
      assertCampResponseBody(expected, actual);

      const id = (actual as { data: { id: string } }).data.id;
      await assertCampModel(id, expected);
    };

    it('should respond with `201` status code when user is authenticated', async () => {
      const accessToken = generateAccessToken(await UserFactory.create());
      const data = campCreateNational;

      const { body } = await request()
        .post(`/api/v1/camps/`)
        .send(data)
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      // Test response
      await assertCampCreated(data, body);
    });

    it('should respond with `201` status code with international camp', async () => {
      const accessToken = generateAccessToken(await UserFactory.create());

      const data = campCreateInternational;

      const { body } = await request()
        .post(`/api/v1/camps/`)
        .send(data)
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      // Test response
      await assertCampCreated(data, body);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      await request().post(`/api/v1/camps/`).send().expect(401);
    });

    it('should be inactive by default', async () => {
      const accessToken = generateAccessToken(await UserFactory.create());
      const data = {
        ...campCreateNational,
        active: undefined,
      };

      const { body } = await request()
        .post(`/api/v1/camps/`)
        .send(data)
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(body).toHaveProperty('data.active', false);
    });

    describe('invalid request body', () => {
      it.each(campCreatedBody)(
        'should validate the request body | $name',
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async ({ data, expected }) => {
          const accessToken = generateAccessToken(await UserFactory.create());

          await request()
            .post(`/api/v1/camps/`)
            .send(data)
            .auth(accessToken, { type: 'bearer' })
            .expect(expected);
        },
      );
    });

    describe('defaults', () => {
      it('should set default form', async () => {
        const accessToken = generateAccessToken(await UserFactory.create());

        const { body } = await request()
          .post(`/api/v1/camps/`)
          .send(campCreateNational)
          .auth(accessToken, { type: 'bearer' })
          .expect(201);

        expect(body.data.form).toHaveProperty('title');
      });

      it('should set default themes', async () => {
        const accessToken = generateAccessToken(await UserFactory.create());

        const { body } = await request()
          .post(`/api/v1/camps/`)
          .send(campCreateNational)
          .auth(accessToken, { type: 'bearer' })
          .expect(201);

        expect(body.data.themes).toHaveProperty('light');
      });

      it('should create default table templates', async () => {
        const accessToken = generateAccessToken(await UserFactory.create());

        const { body } = await request()
          .post(`/api/v1/camps/`)
          .send(campCreateNational)
          .auth(accessToken, { type: 'bearer' })
          .expect(201);

        const templates = await prisma.tableTemplate.findMany({
          where: {
            camp: { id: body.data.id },
          },
        });

        expect(templates.length).not.toBe(0);
      });

      it('should create default message templates', async () => {
        const accessToken = generateAccessToken(await UserFactory.create());

        const { body } = await request()
          .post(`/api/v1/camps/`)
          .send(campCreateNational)
          .auth(accessToken, { type: 'bearer' })
          .expect(201);

        const templates = await prisma.messageTemplate.findMany({
          where: {
            camp: { id: body.data.id },
          },
        });

        expect(templates.length).not.toBe(0);
      });

      it('should create default files', async () => {
        const accessToken = generateAccessToken(await UserFactory.create());

        const { body } = await request()
          .post(`/api/v1/camps/`)
          .send(campCreateNational)
          .auth(accessToken, { type: 'bearer' })
          .expect(201);

        const files = await prisma.file.findMany({
          where: {
            camp: { id: body.data.id },
          },
        });

        expect(files.length).not.toBe(0);
      });
    });

    describe('reference id', () => {
      it('should copy the form of the referenced camp', async () => {
        const referenceForm = {
          title: 'Reference camp title',
        };
        const { camp: referenceCamp, accessToken } =
          await createCampWithManagerAndToken({ form: referenceForm });

        const data = {
          ...campCreateNational,
          referenceCampId: referenceCamp.id,
        };

        const { body } = await request()
          .post(`/api/v1/camps/`)
          .send(data)
          .auth(accessToken, { type: 'bearer' })
          .expect(201);

        expect(body.data.form).toStrictEqual(referenceForm);
      });

      it('should copy the themes of the referenced camp', async () => {
        const referenceThemes = {
          light: { themeName: 'Test' },
        };
        const { camp: referenceCamp, accessToken } =
          await createCampWithManagerAndToken({ themes: referenceThemes });

        const data = {
          ...campCreateNational,
          referenceCampId: referenceCamp.id,
        };

        const { body } = await request()
          .post(`/api/v1/camps/`)
          .send(data)
          .auth(accessToken, { type: 'bearer' })
          .expect(201);

        expect(body.data.themes).toStrictEqual(referenceThemes);
      });

      it('should copy all table templates from the referenced camp', async () => {
        const { camp: referenceCamp, accessToken } =
          await createCampWithManagerAndToken();
        await TableTemplateFactory.create({
          camp: { connect: { id: referenceCamp.id } },
          data: {
            title: 'Template 1',
            columns: [],
          },
        });
        await TableTemplateFactory.create({
          camp: { connect: { id: referenceCamp.id } },
          data: {
            title: 'Template 2',
            columns: [],
          },
        });

        const data = {
          ...campCreateNational,
          referenceCampId: referenceCamp.id,
        };

        const { body } = await request()
          .post(`/api/v1/camps/`)
          .send(data)
          .auth(accessToken, { type: 'bearer' })
          .expect(201);

        const templates = await prisma.tableTemplate.findMany({
          where: {
            camp: { id: body.data.id },
          },
        });

        expect(templates.length).toBe(2);
        expect(
          templates.some((value) => value.data.title === 'Template 1'),
        ).toBeTruthy();
        expect(
          templates.some((value) => value.data.title === 'Template 2'),
        ).toBeTruthy();
      });

      it('should copy all message templates from the referenced camp', async () => {
        const { camp: referenceCamp, accessToken } =
          await createCampWithManagerAndToken({
            messageTemplates: {},
          });

        await MessageTemplateFactory.create({
          camp: { connect: { id: referenceCamp.id } },
          event: 'registration_confirmed',
        });
        await MessageTemplateFactory.create({
          camp: { connect: { id: referenceCamp.id } },
          event: 'registration_waitlist_accepted',
        });

        const data = {
          ...campCreateNational,
          referenceCampId: referenceCamp.id,
        };

        const { body } = await request()
          .post(`/api/v1/camps/`)
          .send(data)
          .auth(accessToken, { type: 'bearer' })
          .expect(201);

        const templates = await prisma.messageTemplate.findMany({
          where: {
            camp: { id: body.data.id },
          },
        });

        expect(templates.length).toBe(2);
        expect(
          templates.some((value) => value.event === 'registration_confirmed'),
        ).toBeTruthy();
        expect(
          templates.some(
            (value) => value.event === 'registration_waitlist_accepted',
          ),
        ).toBeTruthy();
      });

      it('should copy all files from the referenced camp', async () => {
        const { camp: referenceCamp, accessToken } =
          await createCampWithManagerAndToken();
        await FileFactory.create({
          camp: { connect: { id: referenceCamp.id } },
          originalName: 'File 1',
        });
        await FileFactory.create({
          camp: { connect: { id: referenceCamp.id } },
          originalName: 'File 2',
        });

        const data = {
          ...campCreateNational,
          referenceCampId: referenceCamp.id,
        };

        const { body } = await request()
          .post(`/api/v1/camps/`)
          .send(data)
          .auth(accessToken, { type: 'bearer' })
          .expect(201);

        const files = await prisma.file.findMany({
          where: {
            camp: { id: body.data.id },
          },
        });

        expect(files.length).toBe(2);
        expect(
          files.some((value) => value.originalName === 'File 1'),
        ).toBeTruthy();
        expect(
          files.some((value) => value.originalName === 'File 2'),
        ).toBeTruthy();
      });

      it('should replace file URLs in the form', async () => {
        const fileUrl = (id: string): string => {
          return `http://localhost:3000/files/${id}`;
        };

        const createForm = (fileId1: string, fileId2: string) => {
          return {
            logo: { default: fileUrl(fileId1) },
            questions: [
              { title: `This is [markdown](${fileUrl(fileId2)})` },
              { title: `And another [markdown](${fileUrl(fileId2)}) link` },
              { title: `Url with [query](${fileUrl(fileId2)}?test=yes)` },
              { title: 'External [link](https://test.net) link' },
            ],
          };
        };

        const fileId1 = ulid();
        const fileId2 = ulid();
        const form = createForm(fileId1, fileId2);

        const { camp: referenceCamp, accessToken } =
          await createCampWithManagerAndToken({ form });

        await FileFactory.create({
          id: fileId1,
          camp: { connect: { id: referenceCamp.id } },
          originalName: 'File 1',
        });
        await FileFactory.create({
          id: fileId2,
          camp: { connect: { id: referenceCamp.id } },
          originalName: 'File 2',
        });

        const data = {
          ...campCreateNational,
          referenceCampId: referenceCamp.id,
        };

        const { body } = await request()
          .post(`/api/v1/camps/`)
          .send(data)
          .auth(accessToken, { type: 'bearer' })
          .expect(201);

        const newFile1 = await prisma.file.findFirst({
          where: {
            camp: { id: body.data.id },
            originalName: 'File 1',
          },
        });
        const newFile2 = await prisma.file.findFirst({
          where: {
            camp: { id: body.data.id },
            originalName: 'File 2',
          },
        });

        expect(body.data.form).toStrictEqual(
          createForm(newFile1.id, newFile2.id),
        );
      });

      it('should respond with `403` status code when user does not manage the reference camp', async () => {
        const accessToken = generateAccessToken(await UserFactory.create());
        const camp = await CampFactory.create();

        const data = {
          ...campCreateNational,
          referenceCampId: camp.id,
        };

        await request()
          .post(`/api/v1/camps/`)
          .send(data)
          .auth(accessToken, { type: 'bearer' })
          .expect(403);
      });

      it('should respond with `403` status code when reference camp does not exist', async () => {
        const accessToken = generateAccessToken(await UserFactory.create());

        const data = {
          ...campCreateNational,
          referenceCampId: ulid(),
        };

        await request()
          .post(`/api/v1/camps/`)
          .send(data)
          .auth(accessToken, { type: 'bearer' })
          .expect(403);
      });
    });
  });

  describe('PATCH /api/v1/camps/:campId', () => {
    it.each([
      { role: 'DIRECTOR', expectedStatus: 200 },
      { role: 'COORDINATOR', expectedStatus: 200 },
      { role: 'COUNSELOR', expectedStatus: 403 },
      { role: 'VIEWER', expectedStatus: 403 },
    ])(
      'should respond with `$expectedStatus` status code when user is $role',
      async ({ role, expectedStatus }) => {
        const { camp, accessToken } = await createCampWithManagerAndToken(
          {},
          role,
        );

        const data = {
          active: true,
          public: false,
          countries: ['de'],
          name: 'Test Camp',
          organizer: 'Test Org',
          contactEmail: 'test@example.com',
          maxParticipants: 10,
          minAge: 10,
          maxAge: 15,
          startAt: moment()
            .add('20 days')
            .startOf('hour')
            .toDate()
            .toISOString(),
          endAt: moment().add('22 days').startOf('hour').toDate().toISOString(),
          price: 100.0,
          location: 'Somewhere',
          form: {},
          themes: {},
        };

        const response = await request()
          .patch(`/api/v1/camps/${camp.id}`)
          .send(data)
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);

        if (expectedStatus === 200) {
          // Test response
          assertCampResponseBody(data, response.body);

          // Test model
          await assertCampModel(camp.id, data);
        }
      },
    );

    it.todo('should update camp data for all registrations');

    it('should update the free places when max participant change', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken(
        campWithMaxParticipantsRolesInternational,
      );
      // Normal registrations
      await RegistrationFactory.create({
        camp: { connect: { id: camp.id } },
        country: 'fr',
        role: 'participant',
      });
      await RegistrationFactory.create({
        camp: { connect: { id: camp.id } },
        country: 'fr',
        role: 'participant',
      });
      // Counselor should not influence free places
      await RegistrationFactory.create({
        camp: { connect: { id: camp.id } },
        country: 'fr',
        role: 'counselor',
      });

      const dataA = {
        maxParticipants: 10,
      };

      const { body: bodyA } = await request()
        .patch(`/api/v1/camps/${camp.id}`)
        .send(dataA)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(bodyA).toHaveProperty('data.freePlaces', 8);

      const dataB = {
        maxParticipants: {
          de: 5,
          fr: 10,
        },
      };

      const { body: bodyB } = await request()
        .patch(`/api/v1/camps/${camp.id}`)
        .send(dataB)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(bodyB).toHaveProperty('data.freePlaces', {
        de: 5,
        fr: 8,
      });
    });

    it('should respond with `403` status code when user is not camp manager', async () => {
      const camp = await CampFactory.create();
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .patch(`/api/v1/camps/${camp.id}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const camp = await CampFactory.create();

      await request().patch(`/api/v1/camps/${camp.id}`).send().expect(401);
    });

    describe('request body', () => {
      it.each(campUpdateBody)(
        'should validate the request body | $name',
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async ({ data, camp: campData, expected }) => {
          const campCreateData = {
            ...campCreateNational,
            ...campData,
          };

          const { camp, accessToken } =
            await createCampWithManagerAndToken(campCreateData);

          await request()
            .patch(`/api/v1/camps/${camp.id}`)
            .send(data)
            .auth(accessToken, { type: 'bearer' })
            .expect(expected);
        },
      );
    });

    it('should respond with `404` status code when camp id does not exists', async () => {
      const accessToken = generateAccessToken(await UserFactory.create());
      const campId = ulid();
      const data = {
        public: true,
      };

      await request()
        .patch(`/api/v1/camps/${campId}`)
        .send(data)
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });
  });

  describe('DELETE /api/v1/camps/:campId', () => {
    it.each([
      { role: 'DIRECTOR', expectedStatus: 204 },
      { role: 'COORDINATOR', expectedStatus: 403 },
      { role: 'COUNSELOR', expectedStatus: 403 },
      { role: 'VIEWER', expectedStatus: 403 },
    ])(
      'should respond with `$expectedStatus` status code when user is $role',
      async ({ role, expectedStatus }) => {
        const { camp, accessToken } = await createCampWithManagerAndToken(
          {},
          role,
        );
        const otherCamp = await CampFactory.create();

        await request()
          .delete(`/api/v1/camps/${camp.id}`)
          .send()
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);

        if (expectedStatus === 204) {
          const campCount = await prisma.camp.count();
          expect(campCount).toBe(1);

          const remainingCamp = await prisma.camp.findFirst();
          expect(remainingCamp?.id).toBe(otherCamp.id);
        } else {
          const campCount = await prisma.camp.count();
          expect(campCount).toBe(2);
        }
      },
    );

    it('should respond with `403` status code when user is not camp manager', async () => {
      const camp = await CampFactory.create();
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .delete(`/api/v1/camps/${camp.id}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(403);

      const campCount = await prisma.camp.count();
      expect(campCount).toBe(1);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const camp = await CampFactory.create();

      await request().delete(`/api/v1/camps/${camp.id}`).send().expect(401);

      const campCount = await prisma.camp.count();
      expect(campCount).toBe(1);
    });

    it('should respond with `404` status code when camp id does not exists', async () => {
      const accessToken = generateAccessToken(await UserFactory.create());
      const campId = ulid();

      await request()
        .delete(`/api/v1/camps/${campId}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });

    it.todo('should delete all files');
  });
});

describe.todo('/api/v1/camps/:campId/files');

describe('/api/v1/files/', () => {
  describe('GET /api/v1/files/:fileId', () => {
    it('should respond with `200` status code when user is camp manager', async () => {
      const { file, accessToken } = await createCampWithFileAndToken();

      await request()
        .get(`/api/v1/files/${file.id}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(200);
    });

    it('should respond with `200` status code when file is public and camp is active', async () => {
      const { file } = await createCampWithFileAndToken('public', true);

      await request().get(`/api/v1/files/${file.id}`).send().expect(200);
    });

    it('should respond with `401` status code when camp is not active', async () => {
      const { file } = await createCampWithFileAndToken('public', false);

      await request().get(`/api/v1/files/${file.id}`).send().expect(401);
    });

    it('should respond with `401` status code when file is not public', async () => {
      const { file } = await createCampWithFileAndToken('private', true);

      await request().get(`/api/v1/files/${file.id}`).send().expect(401);
    });

    it('should respond with `403` status code when user is not camp manager', async () => {
      const { file } = await createCampWithFileAndToken();
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .get(`/api/v1/files/${file.id}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const { file } = await createCampWithFileAndToken();

      await request().get(`/api/v1/files/${file.id}`).send().expect(401);
    });

    it('should respond with `404` status code when file id does not exists', async () => {
      const fileId = ulid();

      await request().get(`/api/v1/files/${fileId}`).send().expect(404);
    });
  });
});
