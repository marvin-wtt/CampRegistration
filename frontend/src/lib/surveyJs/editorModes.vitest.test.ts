import { describe, expect, it } from 'vitest';
import {
  QuestionAdornerViewModel,
  SurveyCreatorModel,
  SurveyLogic,
} from 'survey-creator-core';
import type { SurveyModel } from 'survey-core';
import '@camp-registration/common/form';
import { hideIrrelevantProperties } from './hiddenProperties';
import {
  addConditionBadge,
  applyEditorMode,
  type EditorModeContext,
} from './editorModes';

hideIrrelevantProperties();

const context: EditorModeContext = {
  creatorLocale: 'en',
  eventLocales: ['en', 'de'],
  restrictedAccess: false,
};

function createCreator() {
  const creator = new SurveyCreatorModel({
    showLogicTab: true,
    showTranslationTab: true,
    showThemeTab: true,
    showJSONEditorTab: true,
  });
  creator.JSON = {
    pages: [
      {
        name: 'page1',
        elements: [{ type: 'text', name: 'email', eventDataType: 'email' }],
      },
    ],
  };
  return creator;
}

function tabs(creator: SurveyCreatorModel): string[] {
  return creator.tabs.filter((tab) => tab.visible).map((tab) => tab.id);
}

function toolboxItems(creator: SurveyCreatorModel): string[] {
  return creator.toolbox.visibleActions.map((item) => item.id);
}

// The property grid is itself a survey: its visible questions are the
// properties the user can edit for the selected element.
function trackPropertyGrid(creator: SurveyCreatorModel): () => string[] {
  let grid: SurveyModel | undefined;
  creator.onSurveyInstanceCreated.add((_, options) => {
    if (options.area === 'property-grid') {
      grid = options.survey;
    }
  });

  return () =>
    grid
      ?.getAllQuestions()
      .filter((question) => question.isVisible)
      .map((question) => question.name) ?? [];
}

function propertyNames(creator: SurveyCreatorModel): string[] {
  const properties = trackPropertyGrid(creator);
  creator.selectElement(creator.survey.getQuestionByName('email'));

  return properties();
}

describe('editor modes', () => {
  it('limits the simple mode to the essentials', () => {
    const creator = createCreator();

    applyEditorMode(creator, 'simple', context);

    const properties = propertyNames(creator);
    expect(tabs(creator)).toEqual(['designer', 'preview', 'translation']);
    expect(toolboxItems(creator)).toContain('date_of_birth');
    expect(toolboxItems(creator)).not.toContain('matrix');
    expect(properties).toContain('eventDataType');
    expect(properties).not.toContain('visibleIf');
  });

  it('rebuilds the property grid of the selected element', () => {
    const creator = createCreator();
    const properties = trackPropertyGrid(creator);
    creator.selectElement(creator.survey.getQuestionByName('email'));

    applyEditorMode(creator, 'simple', context);

    expect(properties()).toContain('eventDataType');
    expect(properties()).not.toContain('visibleIf');
  });

  it('hides the translation tab for a single-language event', () => {
    const creator = createCreator();

    applyEditorMode(creator, 'simple', { ...context, eventLocales: ['de'] });

    expect(tabs(creator)).toEqual(['designer', 'preview']);
  });

  it('restores everything when switching from simple to expert', () => {
    const creator = createCreator();

    applyEditorMode(creator, 'simple', context);
    applyEditorMode(creator, 'expert', context);

    const properties = propertyNames(creator);
    expect(tabs(creator)).toContain('json');
    expect(toolboxItems(creator)).toContain('matrix');
    expect(properties).toContain('visibleIf');
    expect(properties).toContain('eventDataType');
  });

  it('shows logic but not the JSON tab in the standard mode', () => {
    const creator = createCreator();

    applyEditorMode(creator, 'standard', context);

    const properties = propertyNames(creator);
    expect(tabs(creator)).toContain('logic');
    expect(tabs(creator)).not.toContain('json');

    expect(properties).toContain('visibleIf');
    expect(properties).toContain('eventDataType');
  });

  it('leaves completion logic to the expert mode', () => {
    const creator = createCreator();
    const logicActions = () =>
      new SurveyLogic(creator.survey, creator).logicTypes.map((t) => t.name);

    applyEditorMode(creator, 'standard', context);
    const standard = logicActions();
    applyEditorMode(creator, 'expert', context);
    const expert = logicActions();

    expect(standard).toContain('question_visibility');
    expect(standard).not.toContain('trigger_complete');
    expect(standard).not.toContain('completedHtmlOnCondition');
    expect(expert).toContain('trigger_complete');
    expect(expert).toContain('completedHtmlOnCondition');
  });

  it('leaves quiz and completion properties out of the standard mode', () => {
    const creator = createCreator();
    const properties = trackPropertyGrid(creator);

    applyEditorMode(creator, 'standard', context);
    creator.selectElement(creator.survey);

    expect(properties()).toContain('completedHtml');
    expect(properties()).not.toContain('completedHtmlOnCondition');
    expect(properties()).not.toContain('showTimer');
  });

  it('offers no data tag on content-only elements', () => {
    const creator = createCreator();
    creator.survey.pages[0]?.addNewQuestion('html', 'info');
    const properties = trackPropertyGrid(creator);

    applyEditorMode(creator, 'expert', context);
    creator.selectElement(creator.survey.getQuestionByName('info'));

    expect(properties()).toContain('html');
    expect(properties()).not.toContain('eventDataType');
  });

  it('never shows the JSON tab with restricted access', () => {
    const creator = createCreator();

    applyEditorMode(creator, 'expert', { ...context, restrictedAccess: true });

    expect(tabs(creator)).not.toContain('json');
  });
});

describe('condition badge', () => {
  function setup() {
    const creator = createCreator();
    const edited: unknown[] = [];
    addConditionBadge(creator, {
      title: () => 'Has conditions',
      onEdit: (element) => edited.push(element),
    });
    const question = creator.survey.getQuestionByName('email');
    const adorner = new QuestionAdornerViewModel(
      creator,
      question,
      undefined as never,
    );
    const badge = () =>
      adorner.actionContainer.getActionById('condition-badge');

    return { creator, question, badge, edited };
  }

  it('marks an element with a condition in the simple mode', () => {
    const { creator, question, badge } = setup();
    applyEditorMode(creator, 'simple', context);

    expect(badge()?.isVisible).toBe(false);

    question.visibleIf = '{age} > 17';

    expect(badge()?.isVisible).toBe(true);
  });

  it('hides the badge outside the simple mode', () => {
    const { creator, question, badge } = setup();
    question.visibleIf = '{age} > 17';
    applyEditorMode(creator, 'simple', context);

    applyEditorMode(creator, 'standard', context);

    expect(badge()?.isVisible).toBe(false);
  });

  it('hands the element to the edit callback', () => {
    const { creator, question, badge, edited } = setup();
    question.visibleIf = '{age} > 17';
    applyEditorMode(creator, 'simple', context);

    badge()?.action();

    expect(edited).toEqual([question]);
  });
});
