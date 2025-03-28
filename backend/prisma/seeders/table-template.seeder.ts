import { BaseSeeder } from './BaseSeeder';

class TableTemplateSeeder extends BaseSeeder {
  name(): string {
    return 'table-template';
  }

  run(): Promise<void> {
    return Promise.resolve();
  }
}

export default new TableTemplateSeeder();
