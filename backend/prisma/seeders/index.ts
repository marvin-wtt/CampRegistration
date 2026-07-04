import prisma from '../client';
import userSeeder from './user.seeder';
import campSeeder from './camp.seeder';
import campManagerSeeder from './camp-manager.seeder';
import tableTemplate from './table-template.seeder';
import newsletterSeeder from './newsletter.seeder';
import auditSeeder from './audit.seeder';
import { BaseSeeder } from './BaseSeeder';

async function main() {
  const seeders: BaseSeeder[] = [
    userSeeder,
    campSeeder,
    tableTemplate,
    campManagerSeeder,
    newsletterSeeder,
    auditSeeder,
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
