import { describe, expect, it, vi } from 'vitest';
import {
  SurveyCreatorModel,
  TabJsonEditorBasePlugin,
} from 'survey-creator-core';
import '@camp-registration/common/form';
import { attachNameRules } from './nameRules';

function createCreator() {
  const creator = new SurveyCreatorModel({ showJSONEditorTab: true });
  creator.JSON = { elements: [{ type: 'text', name: 'first_name' }] };
  attachNameRules(creator, {
    message: (issue) => `issue:${issue}`,
    blocked: ({ name, issue }) => `blocked:${name}:${issue}`,
  });
  const notify = vi.spyOn(creator, 'notify').mockImplementation(() => {});

  return { creator, notify };
}

function jsonPlugin(creator: SurveyCreatorModel): TabJsonEditorBasePlugin {
  const plugin = creator.getPlugin('json');
  if (!(plugin instanceof TabJsonEditorBasePlugin)) {
    throw new Error('No JSON tab');
  }
  return plugin;
}

describe('attachNameRules', () => {
  it('reports a reserved name typed into the property grid', () => {
    const { creator } = createCreator();
    const question = creator.survey.getQuestionByName('first_name');
    const event = {
      obj: question,
      propertyName: 'name',
      value: 'event',
      error: '',
    };

    creator.onPropertyDisplayCustomError.fire(creator, event as never);

    expect(event.error).toBe('issue:variable');
  });

  it('leaves other properties and ordinary names alone', () => {
    const { creator } = createCreator();
    const question = creator.survey.getQuestionByName('first_name');
    const title = {
      obj: question,
      propertyName: 'title',
      value: '_x',
      error: '',
    };
    const name = {
      obj: question,
      propertyName: 'name',
      value: 'age',
      error: '',
    };

    creator.onPropertyDisplayCustomError.fire(creator, title as never);
    creator.onPropertyDisplayCustomError.fire(creator, name as never);

    expect(title.error).toBe('');
    expect(name.error).toBe('');
  });

  it('keeps the JSON tab open while it holds a reserved name', () => {
    const { creator, notify } = createCreator();
    creator.switchTab('json');
    jsonPlugin(creator).model.text = JSON.stringify({
      elements: [{ type: 'text', name: 'kids.meds' }],
    });

    creator.switchTab('designer');

    expect(creator.activeTab).toBe('json');
    expect(notify).toHaveBeenCalledWith('blocked:kids.meds:separator', 'error');
  });

  it('leaves the JSON tab once the names are fine', () => {
    const { creator, notify } = createCreator();
    creator.switchTab('json');
    jsonPlugin(creator).model.text = JSON.stringify({
      elements: [{ type: 'text', name: 'meds' }],
    });

    creator.switchTab('designer');

    expect(creator.activeTab).toBe('designer');
    // The creator's own "Modified" notice aside, nothing is reported.
    expect(notify).not.toHaveBeenCalledWith(expect.anything(), 'error');
  });
});
