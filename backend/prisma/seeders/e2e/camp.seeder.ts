import { CampFactory } from '../../factories';

export async function seedE2eCamps(): Promise<void> {
  await CampFactory.create({
    id: '01JHP0CXJFR4MQS8SF1HQJCY38',
    name: 'Simple Camp',
    public: true,
    form: {
      name: 'Simple test camp',
      description: 'Camp without special fields or translations',
      elements: [
        {
          name: 'first_name',
          type: 'text',
          required: true,
        },
        {
          name: 'last_name',
          type: 'text',
          required: true,
        },
      ],
    },
  });

  await CampFactory.create({
    id: '01JKEMXG5C62NBMA6V0QQDJ7JD',
    name: 'Files Camp',
    public: true,
    registrationOpensAt: '2025-11-05T20:13:53.577Z',
    form: {
      name: 'Files test camp',
      description: 'Camp without special fields or translations',
      elements: [
        {
          name: 'first_name',
          type: 'text',
          required: true,
        },
        {
          name: 'files',
          type: 'file',
          required: true,
          allowMultiple: true,
        },
      ],
    },
  });
}
