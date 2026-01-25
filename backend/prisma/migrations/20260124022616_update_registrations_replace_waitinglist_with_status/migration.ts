import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction(async (tx) => {
    const tableTemplates = await tx.tableTemplate.findMany();

    for (const tableTemplate of tableTemplates) {
      let modified = false;

      if ('filterWaitingList' in tableTemplate.data) {
        modified = true;

        const val = tableTemplate.data.filterWaitingList;
        if (val === 'include') {
          tableTemplate.data.filterStatus = ['ACCEPTED', 'WAITLISTED'];
        } else if (val === 'only') {
          tableTemplate.data.filterStatus = ['WAITLISTED'];
        } else if (val === 'exclude') {
          tableTemplate.data.filterStatus = ['ACCEPTED'];
        }

        delete tableTemplate.data.filterWaitingList;
      }

      if ('columns' in tableTemplate && Array.isArray(tableTemplate.columns)) {
        // Replace the waiting list column
        for (const column of tableTemplate.columns) {
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
          data: tableTemplate,
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
