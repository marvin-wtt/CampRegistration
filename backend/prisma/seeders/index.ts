import prisma from '../factories/prisma';
import userSeeder from './user.seeder';
import campSeeder from './camp.seeder';
import messageTemplate from './message-template.seeder';
import registrationSeeder from './registration.seeder';
import campManagerSeeder from './camp-manager.seeder';
import tableTemplate from './table-template.seeder';
import { BaseSeeder } from './BaseSeeder';

async function main() {
  const seeders: BaseSeeder[] = [
    userSeeder,
    campSeeder,
    tableTemplate,
    campManagerSeeder,
    messageTemplate,
    registrationSeeder,
  ];

  console.log(`Start seeding ...`);
  for (const seeder of seeders) {
    console.log(`Starting to seed with ${seeder.name()} seeder.`);
    await seeder.run(prisma);
  }
  console.log(`Seeding finished.`);
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
