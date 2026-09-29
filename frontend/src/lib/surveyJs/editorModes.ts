import {
  defaultPropertyGridDefinition,
  type ICreatorPresetData,
  type ISurveyPropertyGridDefinition,
  type SurveyCreatorModel,
  SurveyLogic,
  UIPreset,
} from 'survey-creator-core';
import { Advanced } from 'survey-creator-core/ui-presets';
import {
  type Base,
  ComputedUpdater,
  createDropdownActionModel,
  type IAction,
  type ListModel,
  surveyLocalization,
  SvgRegistry,
} from 'survey-core';

export const EDITOR_MODES = ['simple', 'standard', 'expert'] as const;
export type EditorMode = (typeof EDITOR_MODES)[number];

export interface EditorModeContext {
  creatorLocale: string;
  eventLocales: string[];
  restrictedAccess: boolean;
}

// Our own question types come first: they are what a registration form needs
// and they carry the event data mapping out of the box.
const SIMPLE_TOOLBOX_CATEGORIES = [
  {
    category: 'registration',
    items: ['address', 'country', 'date_of_birth', 'role'],
  },
  {
    category: 'choice',
    items: ['radiogroup', 'checkbox', 'dropdown', 'boolean'],
  },
  { category: 'text', items: ['text', 'comment', 'file'] },
  { category: 'containers', items: ['panel', 'html'] },
];

const SIMPLE_QUESTION_TYPES = new Set(
  SIMPLE_TOOLBOX_CATEGORIES.flatMap((category) => category.items),
);

const SIMPLE_PROPERTY_GRID: ISurveyPropertyGridDefinition = {
  generateOtherTab: false,
  classes: {
    survey: { properties: ['title', 'description', 'completedHtml'] },
    page: { properties: ['title', 'description'] },
    panel: { properties: ['title', 'description'] },
    question: {
      properties: ['name', 'title', 'description', 'isRequired'],
    },
    selectbase: {
      properties: ['choices', 'showOtherItem', 'showNoneItem'],
    },
    text: { properties: ['inputType', 'placeholder'] },
    comment: { properties: ['placeholder'] },
    file: { properties: ['allowMultiple', 'acceptedCategories', 'maxSize'] },
    boolean: { properties: ['labelTrue', 'labelFalse'] },
    html: { properties: ['html'] },
  },
};

// Simple hides the property grid rows that hold conditions, so an element
// carrying one gets a badge instead — otherwise it would show or hide itself
// for no visible reason.
const CONDITION_PROPERTIES = [
  'visibleIf',
  'enableIf',
  'requiredIf',
  'resetValueIf',
  'setValueIf',
  'defaultValueExpression',
  'choicesVisibleIf',
  'choicesEnableIf',
];

export function conditionProperty(element: Base): string | undefined {
  if (element.getType() === 'expression') {
    return 'expression';
  }
  return CONDITION_PROPERTIES.find((name) => !!element.getPropertyValue(name));
}

export function addConditionBadge(
  creator: SurveyCreatorModel,
  options: { title: () => string; onEdit: (element: Base) => void },
): void {
  creator.onElementGetActions.add((_, { element, actions }) => {
    actions.unshift({
      id: 'condition-badge',
      iconName: 'icon-logic-24x24',
      title: options.title(),
      tooltip: options.title(),
      showTitle: false,
      // Tracks both the mode and the element's own conditions, so the badge
      // follows a mode switch or a condition being removed in Standard.
      visible: new ComputedUpdater(
        () =>
          creator.activePresetName === 'simple' && !!conditionProperty(element),
      ),
      action: () => options.onEdit(element),
    });
  });
}

export function buildEditorModePreset(
  mode: EditorMode,
  context: EditorModeContext,
  activeTab?: string,
): ICreatorPresetData {
  const tabs = modeTabs(mode, context);

  return {
    // A preset always applies its languages — even when omitted, it resets
    // them to none — so the event's locales must be passed every time.
    languages: {
      creator: context.creatorLocale,
      surveyLocales: surveyLocales(context.eventLocales),
    },
    tabs: {
      items: tabs.map((name) => ({ name })),
      activeTab: activeTab && tabs.includes(activeTab) ? activeTab : 'designer',
    },
    toolbox:
      mode === 'simple'
        ? {
            definition: [...SIMPLE_QUESTION_TYPES].map((name) => ({ name })),
            categories: SIMPLE_TOOLBOX_CATEGORIES,
            showCategoryTitles: true,
          }
        : {},
    // A preset without a definition leaves the previous one in place, so each
    // mode sets its own explicitly.
    propertyGrid: {
      definition: modePropertyGrid(mode),
    },
  };
}

// English stays available as the survey's default locale, as before presets.
export function surveyLocales(eventLocales: string[]): string[] {
  return [...new Set(['en', ...eventLocales])];
}

function modeTabs(mode: EditorMode, context: EditorModeContext): string[] {
  const tabs = ['designer', 'preview'];
  const multilingual = context.eventLocales.length > 1;

  if (mode === 'simple') {
    return multilingual ? [...tabs, 'translation'] : tabs;
  }

  tabs.push('logic', 'translation', 'theme');
  if (mode === 'expert' && !context.restrictedAccess) {
    tabs.push('json');
  }

  return tabs;
}

// Beyond what the editor hides in every mode, Standard leaves out the
// completion logic and question shuffling that only an expert should reach.
const STANDARD_EXCLUDED_PROPERTIES = new Set([
  'completedHtmlOnCondition',
  'navigateToUrlOnCondition',
  'questionOrder',
]);

const STANDARD_PROPERTY_GRID = withoutProperties(
  Advanced.json.propertyGrid
    .definition as unknown as ISurveyPropertyGridDefinition,
  STANDARD_EXCLUDED_PROPERTIES,
);

function withoutProperties(
  definition: ISurveyPropertyGridDefinition,
  excluded: Set<string>,
): ISurveyPropertyGridDefinition {
  const classes = Object.fromEntries(
    Object.entries(definition.classes).map(([name, classDefinition]) => {
      const copy = { ...classDefinition };
      if (copy.properties) {
        copy.properties = copy.properties.filter(
          (property) =>
            !excluded.has(
              typeof property === 'string' ? property : property.name,
            ),
        );
      }
      return [name, copy];
    }),
  );

  return { ...definition, classes };
}

function modePropertyGrid(mode: EditorMode): ISurveyPropertyGridDefinition {
  switch (mode) {
    case 'simple':
      return SIMPLE_PROPERTY_GRID;
    case 'standard':
      return STANDARD_PROPERTY_GRID;
    case 'expert':
      return defaultPropertyGridDefinition;
  }
}

// Logic tab actions counterpart to the excluded properties: ending the form
// early would submit a partial registration.
const STANDARD_EXCLUDED_LOGIC_ACTIONS = new Set([
  'trigger_complete',
  'completedHtmlOnCondition',
]);

function modeLogicActions(mode: EditorMode): string[] {
  // An empty list means SurveyJS offers every action.
  return mode === 'standard'
    ? SurveyLogic.types
        .map((type) => type.name)
        .filter((name) => !STANDARD_EXCLUDED_LOGIC_ACTIONS.has(name))
    : [];
}

export function applyEditorMode(
  creator: SurveyCreatorModel,
  mode: EditorMode,
  context: EditorModeContext,
): void {
  const selected = creator.selectedElement;
  const preset = new UIPreset({
    name: mode,
    json: buildEditorModePreset(mode, context, creator.activeTab),
  });
  // Global in SurveyJS, but only one editor is open at a time. Set before the
  // preset so a Logic tab it activates is built with the right actions.
  SurveyLogic.visibleActions = modeLogicActions(mode);
  preset.applyTo(creator);
  creator.toolbox.keepAllCategoriesExpanded = true;

  // A new definition only partly rebuilds the grid of the element that is
  // already selected — its other categories linger — so select it afresh.
  if (selected) {
    creator.selectElement(null);
    creator.selectElement(selected);
  }
}

// Undoes the globals `applyEditorMode` sets, so they don't outlive the editor.
export function resetEditorModeGlobals(): void {
  SurveyLogic.visibleActions = [];
  surveyLocalization.supportedLocales = [];
}

// Signal bars, one filled per mode, so the compact dropdown still shows the
// current mode at a glance.
function modeIconSvg(filled: number): string {
  const bars = [
    [4, 14],
    [10, 9],
    [16, 4],
  ].map(
    ([x, y], index) =>
      `<rect x="${x}" y="${y}" width="4" height="${20 - y!}" rx="1"` +
      (index < filled ? '' : ' fill-opacity="0.3"') +
      '/>',
  );
  return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">${bars.join('')}</svg>`;
}

EDITOR_MODES.forEach((mode, index) => {
  SvgRegistry.registerIcon(`editor-mode-${mode}`, modeIconSvg(index + 1));
});

export interface EditorModeActionOptions {
  mode: EditorMode;
  title: (mode: EditorMode) => string;
  tooltip: (mode: EditorMode) => string;
  onSelect: (mode: EditorMode) => void;
  // Icon only, for the narrow footer bar on mobile.
  compact?: boolean;
  // 'top' for a toolbar at the bottom of the screen.
  verticalPosition?: 'top' | 'bottom';
}

// A dropdown in the creator's own toolbar, so switching modes costs no extra
// vertical space.
export function createEditorModeAction(options: EditorModeActionOptions) {
  const items: IAction[] = EDITOR_MODES.map((mode) => ({
    id: mode,
    title: options.title(mode),
  }));

  const action = createDropdownActionModel(
    { id: 'editor-mode', showTitle: !options.compact, visible: true },
    {
      items,
      allowSelection: true,
      onSelectionChanged: (item) => options.onSelect(item.id as EditorMode),
      verticalPosition: options.verticalPosition ?? 'bottom',
    },
  );

  function update(mode: EditorMode) {
    const list = action.data as ListModel;
    list.actions.forEach((item) => {
      item.title = options.title(item.id as EditorMode);
    });
    const selected = list.actions.find((item) => item.id === mode);
    if (selected) {
      list.selectedItem = selected;
    }
    action.title = options.title(mode);
    action.tooltip = options.tooltip(mode);
    if (options.compact) {
      action.iconName = `icon-editor-mode-${mode}`;
    }
  }

  update(options.mode);

  return { action, update };
}
