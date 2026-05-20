import dotenv from 'dotenv';
import { resolve } from 'path';
import { PrismaClient } from '#generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

dotenv.config({ path: resolve(import.meta.dirname, '../../../.env') });

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(process.env.DATABASE_URL!),
});

async function main() {
  await prisma.$transaction(async (tx) => {
    const tableTemplates = await tx.tableTemplate.findMany();

    for (const tableTemplate of tableTemplates) {
      let modified = false;

      if ('filterWaitingList' in tableTemplate.data) {
        modified = true;

        const val = tableTemplate.data.filterWaitingList;
        if (val === 'only') {
          tableTemplate.data.filterStatus = ['WAITLISTED'];
        } else if (val === 'exclude') {
          tableTemplate.data.filterStatus = ['ACCEPTED'];
        } else {
          tableTemplate.data.filterStatus = undefined;
        }

        delete tableTemplate.data.filterWaitingList;
      }

      if (
        'columns' in tableTemplate.data &&
        Array.isArray(tableTemplate.data.columns)
      ) {
        // Replace the waiting list column
        for (const column of tableTemplate.data.columns) {
          if (
            column.name !== 'waiting_list' ||
            column.field !== 'waitingList' ||
            column.renderAs !== 'icon' ||
            column.showIf !== '$waitingList == true'
          ) {
            continue;
          }

          modified = true;

          column.name = 'status';
          column.label = {
            en: 'Status',
            de: 'Status',
            fr: 'Statut',
            cs: 'Stav',
            pl: 'Status',
          };
          column.field = 'status';
          column.renderAs = 'status';

          delete column.renderOptions;
          delete column.showIf;
        }
      }

      if (modified) {
        await tx.tableTemplate.update({
          where: { id: tableTemplate.id },
          data: { data: tableTemplate.data },
        });
      }
    }
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());
