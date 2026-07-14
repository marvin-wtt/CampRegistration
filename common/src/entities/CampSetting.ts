import type { Identifiable } from './Identifiable.js';

export interface CampSetting<T = unknown> extends Identifiable {
  key: string;
  data: T;
}

export interface CampSettingUpdateData<T = unknown> {
  data: T;
}
