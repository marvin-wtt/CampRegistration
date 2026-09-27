import form from './form.js';
import tableTemplates from './tableTemplates.js';
import messageTemplates from './messageTemplates.js';
import type { EventPreset } from '../types.js';

export default {
  form,
  tableTemplates,
  messageTemplates,
  themes: {},
  settings: {
    navigation: { hiddenItems: ['room_planner', 'chore_planner'] },
  },
} satisfies EventPreset;
