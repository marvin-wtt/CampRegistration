import { env } from '#config/enviroment';

export default {
  secret: env.CSRF_SECRET,
};
