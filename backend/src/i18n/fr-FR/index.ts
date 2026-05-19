import auth from './auth/index.js';
import camp from './/camp/index.js';
import email from './email/index.js';
import feedback from './feedback/index.js';
import manager from './manager/index.js';
import newsletter from './newsletter/index.js';
import registration from './registration/index.js';

export default {
  // Translation is the default namespace
  translation: {
    appName: "Service d'inscription aux camps",
  },
  auth,
  camp,
  email,
  feedback,
  manager,
  newsletter,
  registration,
};
