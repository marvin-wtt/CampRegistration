import type { Prisma } from '#generated/prisma/client.js';

export async function up(tx: Prisma.TransactionClient): Promise<void> {
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
}
