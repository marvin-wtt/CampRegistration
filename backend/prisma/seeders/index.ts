import prisma from '../client';
import userSeeder from './user.seeder';
import campSeeder from './camp.seeder';
import campManagerSeeder from './camp-manager.seeder';
import tableTemplateSeeder from './table-template.seeder';
import taskSeeder from './task.seeder';
import newsletterSeeder from './newsletter.seeder';
import organizationSeeder from './organization.seeder';
import { BaseSeeder } from './BaseSeeder';

async function main() {
  // Order is a dependency order: camps need their organization, managers need
  // both, and tasks are assigned to manager records.
  const seeders: BaseSeeder[] = [
    userSeeder,
    organizationSeeder,
    campSeeder,
    tableTemplateSeeder,
    campManagerSeeder,
    taskSeeder,
    newsletterSeeder,
  ];

  console.log(`Start seeding ...`);
  for (const seeder of seeders) {
    console.log(`Starting to seed with ${seeder.name()} seeder.`);
    await seeder.run(prisma);
  }
  console.log(`Seeding finished. See prisma/seeders/README.md for the`);
  console.log(`accounts and the scenario each seeded camp covers.`);
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
