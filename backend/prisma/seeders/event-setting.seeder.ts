import type { Event } from '#generated/prisma/client.js';
import { SETTING_KEYS } from '@camp-registration/common/settings';
import type {
  ProgramPlannerSettings,
  RoomPlannerSettings,
} from '@camp-registration/common/settings';
import { EventSettingFactory } from '../factories';

// `satisfies`, not an annotation: the JSON column is typed as
// `Record<string, unknown>`, which an interface is not assignable to.
const roomPlanner = {
  skipGenderFilter: false,
  skipRoleFilter: false,
  sortBy: 'age',
} satisfies RoomPlannerSettings;

const programPlanner = {
  dayStart: '07:00',
  dayEnd: '23:00',
  timeInterval: 30,
  showAllTranslations: true,
  browseOutsideEventDates: false,
} satisfies ProgramPlannerSettings;

/** Stored settings, so the planners start from something other than defaults. */
export class EventSettingSeeder {
  constructor(private event: Event) {}

  async seed(): Promise<void> {
    const event = { connect: { id: this.event.id } };

    await EventSettingFactory.create({
      event,
      key: SETTING_KEYS.ROOM_PLANNER,
      data: roomPlanner,
    });

    await EventSettingFactory.create({
      event,
      key: SETTING_KEYS.PROGRAM_PLANNER,
      data: programPlanner,
    });
  }
}
