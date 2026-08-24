import auth from './auth/index.js';
import event from './event/index.js';
import email from './email/index.js';
import feedback from './feedback/index.js';
import manager from './manager/index.js';
import newsletter from './newsletter/index.js';
import organization from './organization/index.js';
import registration from './registration/index.js';

export default {
  // Translation is the default namespace
  translation: {
    appName: 'Serwis rejestracji na wydarzenia',
  },
  auth,
  event,
  email,
  feedback,
  manager,
  newsletter,
  organization,
  registration,
};
