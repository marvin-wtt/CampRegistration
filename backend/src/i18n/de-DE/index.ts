import auth from './auth/index.js';
import camp from './camp/index.js';
import email from './email/index.js';
import manager from './manager/index.js';
import registration from './manager/index.js';

export default {
  // Translation is the default namespace
  translation: {
    appName: 'Camp Anmeldedienst',
  },
  auth,
  camp,
  email,
  manager,
  registration,
};
