import type { Identifiable } from './Identifiable.js';

export interface EventSetting<T = unknown> extends Identifiable {
  key: string;
  data: T;
}

export interface EventSettingUpdateData<T = unknown> {
  data: T;
}
