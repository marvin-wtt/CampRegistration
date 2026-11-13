import auth from './auth/index.js';
import event from './event/index.js';
import email from './email/index.js';
import feedback from './feedback/index.js';
import finance from './finance/index.js';
import manager from './manager/index.js';
import newsletter from './newsletter/index.js';
import organization from './organization/index.js';
import programPublic from './programPublic/index.js';
import registration from './registration/index.js';
import task from './task/index.js';

export default {
  // Translation is the default namespace
  translation: {
    appName: 'Inscriva',
  },
  auth,
  event,
  email,
  feedback,
  finance,
  manager,
  newsletter,
  organization,
  programPublic,
  registration,
  task,
};
