import { type GuardFn, or } from '#core/guard';
import { hasEventPermission } from '#app/event/event.guard';

/** Everyone who works with finances at all: recording or reviewing. */
export const financeMember: GuardFn = or(
  hasEventPermission('event.expenses.create'),
  hasEventPermission('event.expenses.view'),
);
