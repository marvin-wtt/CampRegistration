import camp from './camp.ts';
import registration from './registration.ts';
import template from './template.ts';
import roomPlanner from './room-planner.ts';
import campManager from './camp-manager.ts';
import campFiles from './camp-files.ts';
import auth from './auth.ts';
import profile from './profile.ts';

export default {
  camp,
  registration,
  template,
  roomPlanner,
  campManager,
  campFiles,
  user: auth,
  profile,
};
