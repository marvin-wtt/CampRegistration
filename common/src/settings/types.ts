/**
 * Shapes of the values stored under each setting key in
 * {@link SETTING_KEYS}. Shared so the backend validation schema
 * (`SettingsRegistry.register`) and the frontend `useCampSettings` call site
 * are checked against the same contract.
 */

/** Stored under `SETTING_KEYS.ROOM_PLANNER`. */
export interface RoomPlannerSettings {
  skipGenderFilter: boolean;
  skipRoleFilter: boolean;
}

/** Stored under `SETTING_KEYS.PROGRAM_PLANNER`. */
export interface ProgramPlannerSettings {
  dayStart: string;
  dayEnd: string;
  timeInterval: number;
  showAllTranslations: boolean;
}
