import type { CoreModule } from '#core/base/CoreModule';
import {
  verifyDatabaseConnection,
  disconnectDatabase,
} from '#core/database/database.client';

export class DatabaseModule implements CoreModule {
  async configure(): Promise<void> {
    await verifyDatabaseConnection();
  }

  async shutdown(): Promise<void> {
    await disconnectDatabase();
  }
}
