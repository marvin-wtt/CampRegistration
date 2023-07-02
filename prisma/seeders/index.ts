import userSeeder from "./user.seeder";
import campSeeder from "./camp.seeder";
import registrationSeeder from "./registration.seeder";
import templateSeeder from "./template.seeder";
import { PrismaClient } from "@prisma/client";
import roomSeeder from "./room.seeder";

const prisma = new PrismaClient();

async function main() {
  const seeders = [userSeeder, campSeeder, registrationSeeder, templateSeeder, roomSeeder];

  console.log(`Start seeding ...`);
  for (const seeder of seeders) {
    console.log(`Starting to seed with ${seeder.name} seeder.`);
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
