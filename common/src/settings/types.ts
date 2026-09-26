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

/**
 * Stored under `SETTING_KEYS.PROGRAM_PUBLIC`. Configures the public, read-only
 * program-calendar link at `/events/:eventId/program`.
 *
 * Publishing is per day, set from that day's own header in the planner via
 * the dedicated `program-public/days` endpoints — each published day is its
 * own row (`ProgramPublishedDay`), not part of this settings object, so two
 * managers publishing different days at once can't clobber each other the
 * way a single shared JSON map would. `enabled` is a separate master switch
 * so a manager can hide the whole link instantly without losing which days
 * were published, and restore them by turning it back on.
 */
export interface ProgramPublicSettings {
  /**
   * Whether the link is publicly reachable at all.
   *
   * @default false
   */
  enabled: boolean;
  /**
   * Whether a viewer may browse to a day before today (in the event's own
   * timezone). When `false`, the public link's navigation is clamped to
   * today at the earliest, even if the event started earlier.
   *
   * @default true
   */
  allowPastDates: boolean;
}
