/**
 * Camp setting keys shared between frontend and backend, so a typo can't
 * silently desync a `useCampSetting` call site from its backend registration
 * (`SettingsRegistry.register`).
 */
export const SETTING_KEYS = {
  ROOM_PLANNER: 'room-planner',
  PROGRAM_PLANNER: 'program-planner',
} as const;

/** Union of all known setting keys, e.g. `'room-planner' | 'program-planner'`. */
export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS];
