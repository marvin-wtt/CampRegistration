/**
 * Camp setting keys shared between frontend and backend, so a typo can't
 * silently desync a `useCampSetting` call site from its backend registration
 * (`SettingsRegistry.register`).
 */
export const SETTING_KEYS = {
  ROOM_PLANNER: 'room-planner',
  PROGRAM_PLANNER: 'program-planner',
} as const;
