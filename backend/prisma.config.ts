import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    seed: 'tsx prisma/seeder/index.ts',
  },
  datasource: {
    url: 'mysql://root:@localhost:3306/camp_registration',
  },
});
