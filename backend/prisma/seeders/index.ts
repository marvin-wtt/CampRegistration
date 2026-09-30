import prisma from '../client';
import userSeeder from './user.seeder';
import eventSeeder from './event.seeder';
import eventManagerSeeder from './event-manager.seeder';
import tableTemplateSeeder from './table-template.seeder';
import taskSeeder from './task.seeder';
import choreSeeder from './chore.seeder';
import newsletterSeeder from './newsletter.seeder';
import auditSeeder from './audit.seeder';
import organizationSeeder from './organization.seeder';
import priceModelSeeder from './price-model.seeder';
import billingSeeder from './billing.seeder';
import { BaseSeeder } from './BaseSeeder';

async function main() {
  // Order is a dependency order: organizations need their price model, events
  // need their organization, managers need both, tasks are assigned to manager
  // records, chores need the registrations and rooms the event seeder creates,
  // and bills count those registrations.
  const seeders: BaseSeeder[] = [
    userSeeder,
    priceModelSeeder,
    organizationSeeder,
    eventSeeder,
    tableTemplateSeeder,
    eventManagerSeeder,
    taskSeeder,
    choreSeeder,
    newsletterSeeder,
    billingSeeder,
    auditSeeder,
  ];

  console.log(`Start seeding ...`);
  for (const seeder of seeders) {
    console.log(`Starting to seed with ${seeder.name()} seeder.`);
    await seeder.run(prisma);
  }
  console.log(`Seeding finished. See prisma/seeders/README.md for the`);
  console.log(`accounts and the scenario each seeded event covers.`);
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
