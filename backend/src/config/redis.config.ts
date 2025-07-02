import { env } from '#config/enviroment';

export default {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
  db: env.REDIS_DB,
  username: env.REDIS_USERNAME,
};
