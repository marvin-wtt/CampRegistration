export type FeatureCategory =
  'registration' | 'planning' | 'communication' | 'trust';

export type FeaturePreviewVariant =
  | 'form'
  | 'table'
  | 'email'
  | 'stats'
  | 'rooms'
  | 'calendar'
  | 'people'
  | 'inbox'
  | 'newsletter'
  | 'checklist'
  | 'rota'
  | 'files'
  | 'org'
  | 'shield'
  | 'directory';

export interface LandingFeature {
  /** i18n key below `feature.` and the value used as the DOM/test id. */
  id: string;
  icon: string;
  category: FeatureCategory;
  preview: FeaturePreviewVariant;
  /** How many `point.N` keys the feature declares. */
  points: number;
  /** Featured entries take a double-width cell in the bento grid. */
  featured?: boolean;
}

/** A catalogue entry with every string resolved for the active locale. */
export interface ResolvedFeature {
  id: string;
  icon: string;
  preview: FeaturePreviewVariant;
  featured: boolean;
  category: string;
  title: string;
  text: string;
  detail: string;
  points: string[];
}

export const FEATURE_CATEGORIES: FeatureCategory[] = [
  'registration',
  'planning',
  'communication',
  'trust',
];

/**
 * Ordered by how much a prospective organizer cares — the first four carry the
 * product and get the wide cells; the rest fill in behind them.
 */
export const LANDING_FEATURES: LandingFeature[] = [
  {
    id: 'forms',
    icon: 'dynamic_form',
    category: 'registration',
    preview: 'form',
    points: 6,
    featured: true,
  },
  {
    id: 'dashboard',
    icon: 'insights',
    category: 'planning',
    preview: 'stats',
    points: 4,
    featured: true,
  },
  {
    id: 'registrations',
    icon: 'table_view',
    category: 'registration',
    preview: 'table',
    points: 7,
    featured: true,
  },
  {
    id: 'emails',
    icon: 'mark_email_read',
    category: 'communication',
    preview: 'email',
    points: 4,
    featured: true,
  },
  {
    id: 'program',
    icon: 'calendar_month',
    category: 'planning',
    preview: 'calendar',
    points: 6,
  },
  {
    id: 'tasks',
    icon: 'checklist',
    category: 'planning',
    preview: 'checklist',
    points: 3,
  },
  {
    id: 'team',
    icon: 'group_add',
    category: 'trust',
    preview: 'people',
    points: 4,
  },
  {
    id: 'messages',
    icon: 'forward_to_inbox',
    category: 'communication',
    preview: 'inbox',
    points: 3,
  },
  {
    id: 'rooms',
    icon: 'bed',
    category: 'planning',
    preview: 'rooms',
    points: 5,
  },
  {
    id: 'newsletters',
    icon: 'campaign',
    category: 'communication',
    preview: 'newsletter',
    points: 3,
  },
  {
    id: 'chores',
    icon: 'restaurant',
    category: 'planning',
    preview: 'rota',
    points: 5,
  },
  {
    id: 'files',
    icon: 'folder_shared',
    category: 'registration',
    preview: 'files',
    points: 3,
  },
  {
    id: 'directory',
    icon: 'travel_explore',
    category: 'registration',
    preview: 'directory',
    points: 3,
  },
  {
    id: 'organizations',
    icon: 'apartment',
    category: 'trust',
    preview: 'org',
    points: 3,
  },
  {
    id: 'privacy',
    icon: 'privacy_tip',
    category: 'trust',
    preview: 'shield',
    points: 4,
  },
];
