import auth from './auth';
import camp from './/camp';
import email from './email';
import registration from './registration';

export default {
  // Translation is the default namespace
  translation: {
    appName: "Service d'inscription aux camps",
  },
  auth,
  camp,
  email,
  registration,
};
