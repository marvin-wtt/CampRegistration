import { CampFactory } from '../factories';

const name = 'camp';

const run = async () => {
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
};

export default {
  name,
  run,
};
