import type { Camp } from '#generated/prisma/client.js';
import { SETTING_KEYS } from '@camp-registration/common/settings';
import type {
  ProgramPlannerSettings,
  RoomPlannerSettings,
} from '@camp-registration/common/settings';
import { CampSettingFactory } from '../factories';

// `satisfies`, not an annotation: the JSON column is typed as
// `Record<string, unknown>`, which an interface is not assignable to.
const roomPlanner = {
  skipGenderFilter: false,
  skipRoleFilter: false,
} satisfies RoomPlannerSettings;

const programPlanner = {
  dayStart: '07:00',
  dayEnd: '23:00',
  timeInterval: 30,
  showAllTranslations: true,
  browseOutsideCampDates: false,
} satisfies ProgramPlannerSettings;

/** Stored settings, so the planners start from something other than defaults. */
export class CampSettingSeeder {
  constructor(private camp: Camp) {}

  async seed(): Promise<void> {
    const camp = { connect: { id: this.camp.id } };

    await CampSettingFactory.create({
      camp,
      key: SETTING_KEYS.ROOM_PLANNER,
      data: roomPlanner,
    });

    await CampSettingFactory.create({
      camp,
      key: SETTING_KEYS.PROGRAM_PLANNER,
      data: programPlanner,
    });
  }
}
