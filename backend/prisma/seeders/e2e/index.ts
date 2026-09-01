import prisma from '../../client.js';
import { main as truncateAll } from '../../scripts/truncate.js';
import { seedE2eUsers } from './user.seeder.js';
import { seedE2eOrganizations } from './organization.seeder.js';
import { seedE2eEvents } from './event.seeder.js';
import { seedE2eEventManagers } from './event-manager.seeder.js';
import { seedE2eRegistrations } from './registration.seeder.js';

async function main() {
  await truncateAll();
  await seedE2eUsers();
  await seedE2eOrganizations();
  await seedE2eEvents();
  await seedE2eEventManagers();
  await seedE2eRegistrations();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
