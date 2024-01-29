import { PrismaClient } from '@prisma/client';
import { CampFactory } from '../factories';

const name = 'camp';

const run = async (prisma: PrismaClient) => {
  await CampFactory.create({
    name: 'Simple Camp',
    public: true,
    form: {
      elements: [
        {
          name: 'input_1',
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
