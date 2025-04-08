import { CampFactory } from '../factories';
import { BaseSeeder } from './BaseSeeder';

class CampSeeder extends BaseSeeder {
  name(): string {
    return 'camp';
  }

  async run(): Promise<void> {
    await CampFactory.create({
      id: '01JHP0CXJFR4MQS8SF1HQJCY38',
      name: 'Simple Camp',
      public: true,
      active: true,
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
      active: true,
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
}

export default new CampSeeder();
