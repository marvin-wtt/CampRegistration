import { env } from '#config/enviroment';

export default {
  driver: env.QUEUE_DRIVER,
};
