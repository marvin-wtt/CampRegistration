import type { Permission } from '@camp-registration/common/permissions';
import type { SettingKey } from '@camp-registration/common/settings';
import type { ZodType } from 'zod';
import { injectable } from 'inversify';
import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';

export interface SettingDefinition<T = unknown> {
  schema: ZodType<T>;
  viewPermission: Permission;
  editPermission: Permission;
}

/**
 * Lets the module that owns a settings shape (e.g. Room, ProgramEvent) declare
 * its validation schema and required permissions without the generic Setting
 * module knowing about it — mirrors `MailableRegistry`.
 */
@injectable()
export class SettingsRegistry {
  private definitions = new Map<SettingKey, SettingDefinition>();

  register<T>(key: SettingKey, definition: SettingDefinition<T>): void {
    if (this.definitions.has(key)) {
      throw new Error(`Duplicate setting key: "${key}"`);
    }

    this.definitions.set(key, definition);
  }

  getOrFail(key: string): SettingDefinition {
    const definition = this.definitions.get(key as SettingKey);
    if (!definition) {
      throw new ApiError(httpStatus.NOT_FOUND, `Unknown setting key: "${key}"`);
    }

    return definition;
  }

  keyOrFail(key: string): SettingKey {
    this.getOrFail(key);
    return key as SettingKey;
  }
}
