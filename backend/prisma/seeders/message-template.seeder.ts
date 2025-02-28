import { PrismaClient } from '@prisma/client';
import { ulid } from 'ulidx';

const name = 'message-template';

const run = async (prisma: PrismaClient) => {
  const camps = await prisma.camp.findMany();

  const templateNames = [
    'registration_confirmation',
    'waiting_list_confirmation',
    'registration_notification',
  ];

  return Promise.all(
    camps.map(async (camp) => {
      return camp.countries.map(async (country) => {
        return templateNames.map((templateName) => {
          // TODO Get defaults and insert if not present
          const template: Record<string, string> = {};

          return prisma.messageTemplate.upsert({
            where: {
              campId_name_locale: {
                campId: camp.id,
                name: templateName,
                locale: country,
              },
            },
            create: {
              id: ulid(),
              campId: camp.id,
              name: templateName,
              locale: country,
              subject: template.subject,
              body: template.body,
              priority: template.priority,
            },
            update: {},
          });
        });
      });
    }),
  );
};

export default {
  name,
  run,
};
