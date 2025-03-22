import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const seeders = [];

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
