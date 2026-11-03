import {
  SETTING_KEYS,
  type ProgramPlannerSettings,
} from '@camp-registration/common/settings';
import { useEventSettings } from '@/composables/eventSettings';

/** The program planner's shared settings, with one set of defaults for every view. */
export function useProgramPlannerSettings() {
  return useEventSettings<ProgramPlannerSettings>(
    SETTING_KEYS.PROGRAM_PLANNER,
    {
      dayStart: '08:00',
      dayEnd: '21:00',
      timeInterval: 30,
      showAllTranslations: false,
      browseOutsideEventDates: false,
      showBirthdays: true,
    },
  );
}
