import type { Request } from 'express';
import type { GuardFn } from '#core/guard';
import { resolve } from '#core/ioc/container';
import { campManager } from '#app/campManager/camp-manager.guard';
import { SettingsRegistry } from '#app/setting/setting.registry';

/**
 * Resolves the required permission from the setting key at request time
 * (rather than a fixed permission at route-definition time), since each
 * registered key declares its own view/edit permission.
 */
export const settingGuard = (action: 'view' | 'edit'): GuardFn => {
  return async (req: Request) => {
    const rawKey = req.params.key;
    const key = Array.isArray(rawKey) ? rawKey[0] : rawKey;
    const definition = resolve(SettingsRegistry).getOrFail(key);
    const permission =
      action === 'view' ? definition.viewPermission : definition.editPermission;

    return campManager(permission)(req);
  };
};
