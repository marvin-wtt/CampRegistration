import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ONBOARDING_SETTINGS,
  resolveOnboardingItems,
  type OnboardingContext,
} from './onboardingChecklist';

function context(
  overrides: Partial<OnboardingContext> = {},
): OnboardingContext {
  return {
    phase: 'setup',
    settings: { ...DEFAULT_ONBOARDING_SETTINGS },
    detected: {
      team: false,
      files: false,
      window: false,
      program: false,
      rooms: false,
      chores: false,
    },
    hiddenTools: [],
    canOpen: () => true,
    can: () => true,
    ...overrides,
  };
}

function statusOf(ctx: OnboardingContext, key: string) {
  return resolveOnboardingItems(ctx).find((item) => item.key === key)?.status;
}

describe('resolveOnboardingItems', () => {
  it('lists the registration items before the event items, in order', () => {
    const items = resolveOnboardingItems(context());

    expect(items.map((item) => item.key)).toEqual([
      'tools',
      'team',
      'form',
      'emails',
      'files',
      'privacy',
      'window',
      'program',
      'finances',
      'rooms',
      'chores',
    ]);
    expect(items.filter((item) => item.group === 'event')).toHaveLength(4);
  });

  it('leaves out items whose page the manager cannot open', () => {
    const items = resolveOnboardingItems(
      context({
        canOpen: (route) => route !== 'management.event.settings.access',
      }),
    );

    expect(items.map((item) => item.key)).not.toContain('team');
  });

  it('leaves out detected items whose data the manager cannot read', () => {
    const items = resolveOnboardingItems(
      context({ can: (permission) => permission !== 'event.chores.view' }),
    );

    expect(items.map((item) => item.key)).not.toContain('chores');
  });

  it('leaves out tools hidden from the navigation', () => {
    const items = resolveOnboardingItems(
      context({ hiddenTools: ['room_planner', 'finances'] }),
    );

    expect(items.map((item) => item.key)).not.toContain('rooms');
    expect(items.map((item) => item.key)).not.toContain('finances');
    expect(items.map((item) => item.key)).toContain('program');
  });

  it('marks items checked by hand as manual', () => {
    const items = resolveOnboardingItems(context());

    expect(items.filter((item) => item.manual).map((item) => item.key)).toEqual(
      ['tools', 'form', 'emails', 'privacy', 'finances'],
    );
  });

  it('completes manual items from the settings', () => {
    const ctx = context({
      settings: { completed: ['form'], skipped: [], hidden: false },
    });

    expect(statusOf(ctx, 'form')).toBe('done');
    expect(statusOf(ctx, 'emails')).toBe('open');
  });

  it('ignores a stored completion for detected items', () => {
    const ctx = context({
      settings: { completed: ['team'], skipped: [], hidden: false },
    });

    expect(statusOf(ctx, 'team')).toBe('open');
  });

  it('completes detected items from their data', () => {
    const ctx = context({ detected: { ...context().detected, rooms: true } });

    expect(statusOf(ctx, 'rooms')).toBe('done');
  });

  it('shows skipped items as skipped', () => {
    const ctx = context({
      settings: { completed: [], skipped: ['team', 'form'], hidden: false },
    });

    expect(statusOf(ctx, 'team')).toBe('skipped');
    expect(statusOf(ctx, 'form')).toBe('skipped');
  });

  it('lets being done win over being skipped', () => {
    const ctx = context({
      settings: {
        completed: ['form'],
        skipped: ['team', 'form'],
        hidden: false,
      },
      detected: { ...context().detected, team: true },
    });

    expect(statusOf(ctx, 'team')).toBe('done');
    expect(statusOf(ctx, 'form')).toBe('done');
  });

  it('shows detected items as loading until their data arrives', () => {
    const ctx = context({ detected: { ...context().detected, files: null } });

    expect(statusOf(ctx, 'files')).toBe('loading');
  });

  it('keeps a skipped item skipped while its data loads', () => {
    const ctx = context({
      settings: { completed: [], skipped: ['files'], hidden: false },
      detected: { ...context().detected, files: null },
    });

    expect(statusOf(ctx, 'files')).toBe('skipped');
  });

  it('tolerates unknown item names in the settings', () => {
    const ctx = context({
      settings: { completed: ['removed'], skipped: ['gone'], hidden: false },
    });

    expect(resolveOnboardingItems(ctx)).toHaveLength(11);
  });

  it('counts every group as current while setting up', () => {
    const items = resolveOnboardingItems(context({ phase: 'setup' }));

    expect(items.every((item) => item.current)).toBe(true);
  });

  it.each(['registration', 'preparation'] as const)(
    'leaves the registration steps behind once in %s',
    (phase) => {
      const items = resolveOnboardingItems(context({ phase }));

      expect(
        items.filter((item) => item.current).map((item) => item.group),
      ).not.toContain('registration');
      expect(
        items
          .filter((item) => item.group === 'event')
          .every((item) => item.current),
      ).toBe(true);
    },
  );

  it('keeps past steps resolvable, e.g. to undo them', () => {
    const ctx = context({
      phase: 'registration',
      settings: { completed: ['form'], skipped: [], hidden: false },
    });

    expect(statusOf(ctx, 'form')).toBe('done');
  });

  it('leaves out steps the manager can see but not do', () => {
    const items = resolveOnboardingItems(
      context({ can: (permission) => permission !== 'event.managers.create' }),
    );

    expect(items.map((item) => item.key)).not.toContain('team');
    expect(items.map((item) => item.key)).toContain('files');
  });
});
