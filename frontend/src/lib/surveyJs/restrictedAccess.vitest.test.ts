import { describe, expect, it } from 'vitest';
import { SurveyCreatorModel } from 'survey-creator-core';
import { Serializer } from 'survey-core';
import '@camp-registration/common/form';
import { addRestrictedAccessRules, restrictToolbox } from './restrictedAccess';

function createCreator() {
  const creator = new SurveyCreatorModel({});
  creator.JSON = {
    elements: [
      { type: 'text', name: 'first_name' },
      { type: 'panel', name: 'empty' },
    ],
  };
  addRestrictedAccessRules(creator);

  return creator;
}

describe('restrictToolbox', () => {
  it('offers only panels', () => {
    const creator = createCreator();
    restrictToolbox(creator);

    expect(creator.toolbox.items.map((item) => item.name)).toEqual(['panel']);
    expect(creator.currentAddQuestionType).toBe('panel');
  });
});

describe('addRestrictedAccessRules', () => {
  it('keeps questions from being deleted, copied or converted', () => {
    const creator = createCreator();
    const options = {
      element: creator.survey.getQuestionByName('first_name'),
      allowDelete: true,
      allowCopy: true,
      allowChangeType: true,
    };

    creator.onElementAllowOperations.fire(creator, options as never);

    expect(options).toMatchObject({
      allowDelete: false,
      allowCopy: false,
      allowChangeType: false,
    });
  });

  it('lets an empty panel be deleted', () => {
    const creator = createCreator();
    const options = {
      element: creator.survey.getPanelByName('empty'),
      allowDelete: true,
    };

    creator.onElementAllowOperations.fire(creator, options as never);

    expect(options.allowDelete).toBe(true);
  });

  it.each(['name', 'eventDataType'])('locks a question’s %s', (name) => {
    const creator = createCreator();
    const options = {
      element: creator.survey.getQuestionByName('first_name'),
      property: Serializer.findProperty('question', name),
      readOnly: false,
    };

    creator.onPropertyGetReadOnly.fire(creator, options as never);

    expect(options.readOnly).toBe(true);
  });

  it('leaves other properties editable', () => {
    const creator = createCreator();
    const options = {
      element: creator.survey.getQuestionByName('first_name'),
      property: Serializer.findProperty('question', 'title'),
      readOnly: false,
    };

    creator.onPropertyGetReadOnly.fire(creator, options as never);

    expect(options.readOnly).toBe(false);
  });
});
