/**
 * Shapes of the values stored under each setting key in
 * {@link SETTING_KEYS}. Shared so the backend validation schema
 * (`SettingsRegistry.register`) and the frontend `useEventSettings` call site
 * are checked against the same contract.
 */

/** Stored under `SETTING_KEYS.ROOM_PLANNER`. */
export interface RoomPlannerSettings {
  skipGenderFilter: boolean;
  skipRoleFilter: boolean;
  sortBy: 'age' | 'name';
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
   * program item, even if they are not the default language. When `false` only
   * the default language is shown.
   *
   * @default true
   */
  showAllTranslations: boolean;
  /**
   * Allow navigating the calendar to dates before the event start / after the
   * event end. When `false` the visible window is clamped to the event
   * period.
   *
   * @default false
   */
  browseOutsideEventDates: boolean;
}

/**
 * Stored under `SETTING_KEYS.NAVIGATION`. Names are frontend-only nav-rail
 * item identifiers (see `EVENT_NAVIGATION_ITEMS` in the frontend) — this is a
 * purely cosmetic setting, so the backend validates it as opaque strings
 * rather than mirroring the frontend's list of item names.
 */
export interface NavigationSettings {
  hiddenItems: string[];
}
