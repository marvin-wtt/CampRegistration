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
  /**
   * Specifies the start time of the day in format HH:MM.
   */
  dayStart: string;
  /**
   * Specifies the end time of the day in format HH:MM.
   */
  dayEnd: string;
  /**
   * Specifies the time interval in minutes.
   */
  timeInterval: number;
  /**
   * When `true`, the program planner shows all translations of a
   * program event, even if they are not the default language. When `false` only
   * the default language is shown.
   *
   * @default true
   */
  showAllTranslations: boolean;
  /**
   * Allow navigating the calendar to dates before the camp start / after the
   * camp end. When `false` the visible window is clamped to the camp
   * period.
   *
   * @default false
   */
  browseOutsideCampDates: boolean;
}
