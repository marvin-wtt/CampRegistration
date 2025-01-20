// This is a workaround
// See https://github.com/quasarframework/quasar/issues/17685
declare module '@quasar/app-vite/lib/testing.js' {
  import { type UserConfig } from 'vite';

  export function getTestingConfig(
    ctxParams?: Record<string, unknown>,
  ): Promise<UserConfig>;
}
