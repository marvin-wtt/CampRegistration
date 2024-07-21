import { Request } from 'express';

export * from './manager.guard';
export { default as admin } from './admin.guard';
export { default as and } from './and.guard';
export { default as or } from './or.guard';

export type GuardFn = (req: Request) => Promise<boolean | string>;
