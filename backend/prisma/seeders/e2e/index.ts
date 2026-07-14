import prisma from '../../client.js';
import { main as truncateAll } from '../../scripts/truncate.js';
import { seedE2eUsers } from './user.seeder.js';
import { seedE2eCamps } from './camp.seeder.js';
import { seedE2eCampManagers } from './camp-manager.seeder.js';
import { seedE2eRegistrations } from './registration.seeder.js';

async function main() {
  await truncateAll();
  await seedE2eUsers();
  await seedE2eCamps();
  await seedE2eCampManagers();
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
