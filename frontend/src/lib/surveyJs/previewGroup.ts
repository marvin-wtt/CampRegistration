import type { SurveyCreatorModel } from 'survey-creator-core';
import {
  ComputedUpdater,
  createDropdownActionModel,
  type IAction,
  type ListModel,
  SvgRegistry,
} from 'survey-core';

// A flag, so it doesn't read as the language selector beside it.
SvgRegistry.registerIcon(
  'preview-group',
  '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M14.4 6 14 4H5v17h2v-7h5.6l.4 2h7V6z"/></svg>',
);

export interface PreviewGroupActionOptions {
  countries: readonly string[];
  group: string;
  title: (country: string) => string;
  tooltip: (country: string) => string;
  onSelect: (country: string) => void;
  // Country code only, for the narrow footer bar on mobile.
  compact?: boolean;
  // 'top' for a toolbar at the bottom of the screen.
  verticalPosition?: 'top' | 'bottom';
}

/**
 * The group the preview is filled in for, like the group step on the event
 * page. Only on the preview and theme tabs: elsewhere there is no form to
 * answer.
 */
export function createPreviewGroupAction(
  creator: SurveyCreatorModel,
  options: PreviewGroupActionOptions,
) {
  const items: IAction[] = options.countries.map((country) => ({
    id: country,
    title: options.title(country),
  }));

  const action = createDropdownActionModel(
    {
      id: 'preview-group',
      iconName: 'icon-preview-group',
      iconSize: 'auto',
      visible: new ComputedUpdater(() =>
        ['preview', 'theme'].includes(creator.activeTab),
      ),
    },
    {
      items,
      allowSelection: true,
      onSelectionChanged: (item) => {
        if (item.id) {
          options.onSelect(item.id);
        }
      },
      verticalPosition: options.verticalPosition ?? 'bottom',
    },
  );

  function update(group: string) {
    const list = action.data as ListModel;
    list.actions.forEach((item) => {
      item.title = options.title(item.id);
    });
    const selected = list.actions.find((item) => item.id === group);
    if (selected) {
      list.selectedItem = selected;
    }
    action.title = options.compact ? group.toUpperCase() : options.title(group);
    action.tooltip = options.tooltip(group);
  }

  update(options.group);

  return { action, update };
}
