import { BaseSeeder } from './BaseSeeder';
import { TableTemplateFactory } from '../factories';

class TableTemplateSeeder extends BaseSeeder {
  name(): string {
    return 'table-template';
  }

  async run(): Promise<void> {
    await TableTemplateFactory.create({
      data: {
        title: 'Test',
        columns: [
          {
            name: 'first_name',
            field: 'computedData.firstName',
            label: { en: 'First Name', de: 'Vorname', fr: 'Prénom' },
            align: 'left',
            sortable: true,
            renderAs: 'name',
          },
          {
            name: 'last_name',
            field: 'computedData.lastName',
            label: { en: 'Last Name', de: 'Nachname', fr: 'Nom de famille' },
            align: 'left',
            sortable: true,
            renderAs: 'name',
          },
        ],
        order: 0,
        filterWaitingList: 'exclude',
        indexed: true,
        actions: true,
        sortBy: 'first_name',
      },
      camp: { connect: { id: '01JHP0CXJFR4MQS8SF1HQJCY38' } },
    });

    await TableTemplateFactory.create({
      data: {
        title: 'Test',
        columns: [
          {
            name: 'first_name',
            field: 'computedData.firstName',
            label: { en: 'First Name', de: 'Vorname', fr: 'Prénom' },
            align: 'left',
            sortable: true,
            renderAs: 'name',
          },
          {
            name: 'last_name',
            field: 'computedData.lastName',
            label: { en: 'Last Name', de: 'Nachname', fr: 'Nom de famille' },
            align: 'left',
            sortable: true,
            renderAs: 'name',
          },
        ],
        order: 0,
        filterWaitingList: 'exclude',
        indexed: true,
        actions: true,
        sortBy: 'first_name',
      },
      camp: { connect: { id: '01K9ATF1H9KD1K6H12F3YK8RWR' } },
    });
  }
}

export default new TableTemplateSeeder();
