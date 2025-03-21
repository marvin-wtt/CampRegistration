import camp from './camp';
import registration from './registration';
import template from './template';
import roomPlanner from './room-planner';
import campManager from './camp-manager';
import campFiles from './camp-files';
import auth from './auth';
import profile from './profile';

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
