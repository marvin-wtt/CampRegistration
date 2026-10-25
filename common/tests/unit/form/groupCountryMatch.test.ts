import { describe, expect, it } from 'vitest';
import { type Question, SurveyModel } from 'survey-core';
import { fakeEventData } from '../../util/faker.js';
import { setVariables } from '../../../src/form/index.js';

const event = fakeEventData({ countries: ['de', 'fr'] });

const countryForm = (groupCountryMatch?: string) =>
  new SurveyModel({
    elements: [{ type: 'country', name: 'country', groupCountryMatch }],
  });

const addressForm = (groupCountryMatch?: string) =>
  new SurveyModel({
    elements: [{ type: 'address', name: 'address', groupCountryMatch }],
  });

const nestedCountry = (model: SurveyModel): Question =>
  model
    .getAllQuestions(false, false, true)
    .find((q) => q.getType() === 'country' && q.parentQuestion)!;

const messages = (question: Question) =>
  question.errors.map((error) => error.notificationType);

describe('group country match', () => {
  describe('strict', () => {
    it("should show the group's country, read-only", () => {
      const model = countryForm('strict');

      setVariables(model, event, { group: 'fr' });

      const question = model.getQuestionByName('country');
      expect(question.value).toBe('fr');
      expect(question.isReadOnly).toBe(true);
    });

    it('should apply to a question without the property', () => {
      const model = countryForm();

      setVariables(model, event, { group: 'fr' });

      expect(model.getQuestionByName('country').isReadOnly).toBe(true);
    });

    it('should reject another country', () => {
      const model = countryForm();
      setVariables(model, event, { group: 'fr' });

      model.setValue('country', 'de');

      expect(model.validate(true)).toBe(false);
      expect(messages(model.getQuestionByName('country'))).toEqual(['error']);
    });

    it('should stay editable when no group is known', () => {
      const model = countryForm();

      setVariables(model, event, { group: null });

      const question = model.getQuestionByName('country');
      expect(question.isReadOnly).toBe(false);
      expect(question.isEmpty()).toBe(true);
    });
  });

  describe('warn', () => {
    it("should prefill the group's country, editable", () => {
      const model = countryForm('warn');

      setVariables(model, event, { group: 'fr' });

      const question = model.getQuestionByName('country');
      expect(question.value).toBe('fr');
      expect(question.isReadOnly).toBe(false);
    });

    it('should warn about another country without rejecting it', () => {
      const model = countryForm('warn');
      setVariables(model, event, { group: 'fr' });

      model.setValue('country', 'it');

      expect(model.validate(true)).toBe(true);
      expect(messages(model.getQuestionByName('country'))).toEqual(['warning']);
    });

    // A warning never stops "Next", so it must not wait for it.
    it('should show the warning as soon as the answer changes', () => {
      const model = countryForm('warn');
      setVariables(model, event, { group: 'fr' });
      const question = model.getQuestionByName('country');

      question.value = 'it';
      expect(messages(question)).toEqual(['warning']);

      question.value = 'fr';
      expect(messages(question)).toEqual([]);
    });

    it("should show the warning as soon as an address's country changes", () => {
      const model = addressForm('warn');
      setVariables(model, event, { group: 'fr' });
      const country = nestedCountry(model);

      country.value = 'it';
      expect(messages(country)).toEqual(['warning']);

      country.value = 'fr';
      expect(messages(country)).toEqual([]);
    });
    it("should show the warning for an address's country in a dynamic panel", () => {
      const model = new SurveyModel({
        elements: [
          {
            type: 'paneldynamic',
            name: 'contacts',
            panelCount: 1,
            templateElements: [
              { type: 'address', name: 'address', groupCountryMatch: 'warn' },
            ],
          },
        ],
      });
      setVariables(model, event, { group: 'fr' });
      const country = nestedCountry(model);

      country.value = 'it';

      expect(messages(country)).toEqual(['warning']);
    });
  });

  describe('free', () => {
    it('should ask without a default or a check', () => {
      const model = countryForm('free');
      setVariables(model, event, { group: 'fr' });

      model.setValue('country', 'it');

      expect(model.validate(true)).toBe(true);
      expect(model.getQuestionByName('country').errors).toHaveLength(0);
    });
  });

  describe('address', () => {
    it('should lock its country by default', () => {
      const model = addressForm();

      setVariables(model, event, { group: 'fr' });

      const country = nestedCountry(model);
      expect(country.value).toBe('fr');
      expect(country.isReadOnly).toBe(true);
    });

    it('should reject loaded answers with another country, as the server does', () => {
      const model = addressForm();
      setVariables(model, event, { group: 'fr' });

      model.data = {
        address: {
          address: 'Main St 1',
          zip_code: '1',
          city: 'A',
          country: 'de',
        },
      };

      expect(model.validate(true)).toBe(false);
      expect(messages(nestedCountry(model))).toEqual(['error']);
    });

    it('should hand its mode to its country', () => {
      const model = addressForm('warn');
      setVariables(model, event, { group: 'fr' });

      const country = nestedCountry(model);
      country.value = 'it';
      model.validate(true);

      expect(country.isReadOnly).toBe(false);
      expect(messages(country)).toEqual(['warning']);
    });

    it('should cover addresses of panels added later', () => {
      const model = new SurveyModel({
        elements: [
          {
            type: 'paneldynamic',
            name: 'contacts',
            templateElements: [{ type: 'address', name: 'address' }],
          },
        ],
      });
      setVariables(model, event, { group: 'fr' });

      (
        model.getQuestionByName('contacts') as Question & {
          addPanel: () => void;
        }
      ).addPanel();

      expect(nestedCountry(model).isReadOnly).toBe(true);
    });
  });

  it('should not add survey handlers per panel', () => {
    const model = new SurveyModel({
      elements: [
        {
          type: 'paneldynamic',
          name: 'contacts',
          templateElements: [
            { type: 'address', name: 'address', groupCountryMatch: 'warn' },
          ],
        },
      ],
    });
    setVariables(model, event, { group: 'fr' });
    const contacts = model.getQuestionByName('contacts') as Question & {
      addPanel: () => void;
    };
    const handlers = () => [
      model.onValueChanged.length,
      model.onVariableChanged.length,
      model.onLocaleChangedEvent.length,
    ];

    contacts.addPanel();
    const before = handlers();
    contacts.addPanel();
    contacts.addPanel();

    expect(handlers()).toEqual(before);
  });

  it("should list every country, the event's first", () => {
    const model = countryForm('free');

    setVariables(model, fakeEventData({ countries: ['fr', 'de'] }), {
      group: 'fr',
    });

    const question = model.getQuestionByName('country') as Question & {
      contentQuestion: { visibleChoices: { value: string }[] };
    };
    const values = question.contentQuestion.visibleChoices.map((c) => c.value);
    expect(values.slice(0, 2)).toEqual(['fr', 'de']);
    expect(values).toContain('it');
  });

  it('should neither lock nor check the country without a group', () => {
    const model = countryForm();
    setVariables(model, event);

    model.setValue('country', 'de');

    expect(model.getQuestionByName('country').isReadOnly).toBe(false);
    expect(model.validate(true)).toBe(true);
  });

  it('should not write the rules into a design surface', () => {
    const model = new SurveyModel();
    model.setDesignMode(true);
    model.fromJSON({ elements: [{ type: 'country', name: 'country' }] });

    setVariables(model, event, { group: 'fr' });

    expect(model.toJSON()).toEqual({
      pages: [
        {
          name: 'page1',
          elements: [{ type: 'country', name: 'country' }],
        },
      ],
    });
  });
});
