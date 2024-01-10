import { describe, expect, it } from 'vitest';
import { SurveyModel } from 'survey-core';
import '../../src/form';

describe('functions', () => {
  describe('isMinor', () => {
    it('should return true when person is a minor', () => {
      const model = new SurveyModel({
        elements: [{ name: 'date_of_birth', type: 'text' }],
        calculatedValues: [
          {
            name: 'calc1',
            expression: 'isMinor({date_of_birth}, {start_date})',
          },
        ],
      });

      model.data = { date_of_birth: '2000-01-01' };
      model.setVariable('start_date', '2008-01-01');

      expect(model.calculatedValues[0].value).toBe(true);
    });

    it('should return false when person is am adult', () => {
      const model = new SurveyModel({
        elements: [{ name: 'date_of_birth', type: 'text' }],
        calculatedValues: [
          {
            name: 'calc1',
            expression: 'isMinor({date_of_birth}, {start_date})',
          },
        ],
      });

      model.data = { date_of_birth: '2000-01-01' };
      model.setVariable('start_date', '2019-01-01');

      expect(model.calculatedValues[0].value).toBe(false);
    });

    it('should return false when person is exactly 18', () => {
      const model = new SurveyModel({
        elements: [{ name: 'date_of_birth', type: 'text' }],
        calculatedValues: [
          {
            name: 'calc1',
            expression: 'isMinor({date_of_birth}, {start_date})',
          },
        ],
      });

      model.data = { date_of_birth: '2000-01-01' };
      model.setVariable('start_date', '2018-01-01');

      expect(model.calculatedValues[0].value).toBe(false);
    });

    it('should return undefined when data of birth is missing', () => {
      const model = new SurveyModel({
        elements: [{ name: 'date_of_birth', type: 'text' }],
        calculatedValues: [
          {
            name: 'calc1',
            expression: 'isMinor({date_of_birth}, {start_date})',
          },
        ],
      });

      model.data = {};
      model.setVariable('start_date', '2008-01-01');

      expect(model.calculatedValues[0].value).toBe(undefined);
    });

    it('should return undefined when start is undefined', () => {
      const model = new SurveyModel({
        elements: [{ name: 'date_of_birth', type: 'text' }],
        calculatedValues: [
          {
            name: 'calc1',
            expression: 'isMinor({date_of_birth}, {start_date})',
          },
        ],
      });

      model.data = { date_of_birth: '2000-01-01' };

      expect(model.calculatedValues[0].value).toBe(undefined);
    });

    it('should return undefined when only one parameter is defined', () => {
      const model = new SurveyModel({
        elements: [{ name: 'date_of_birth', type: 'text' }],
        calculatedValues: [
          {
            name: 'calc1',
            expression: 'isMinor({date_of_birth})',
          },
        ],
      });

      model.data = { date_of_birth: '2000-01-01' };

      expect(model.calculatedValues[0].value).toBe(undefined);
    });

    it('should return undefined when no parameter is defined', () => {
      const model = new SurveyModel({
        elements: [{ name: 'date_of_birth', type: 'text' }],
        calculatedValues: [
          {
            name: 'calc1',
            expression: 'isMinor()',
          },
        ],
      });

      expect(model.calculatedValues[0].value).toBe(undefined);
    });

    it('should return undefined when no date of birth is invalid', () => {
      const model = new SurveyModel({
        elements: [{ name: 'date_of_birth', type: 'text' }],
        calculatedValues: [
          {
            name: 'calc1',
            expression: 'isMinor({date_of_birth}, {start_date})',
          },
        ],
      });

      model.data = { date_of_birth: 'invalid' };
      model.setVariable('start_date', '2008-01-01');

      expect(model.calculatedValues[0].value).toBe(undefined);
    });

    it('should return undefined when no start is invalid', () => {
      const model = new SurveyModel({
        elements: [{ name: 'date_of_birth', type: 'text' }],
        calculatedValues: [
          {
            name: 'calc1',
            expression: 'isMinor({date_of_birth}, {start_date})',
          },
        ],
      });

      model.data = { date_of_birth: '2000-01-01' };
      model.setVariable('start_date', 'invalid');

      expect(model.calculatedValues[0].value).toBe(undefined);
    });

    it('should accept a date as start parameter', () => {
      const model = new SurveyModel({
        elements: [{ name: 'date_of_birth', type: 'text' }],
        calculatedValues: [
          {
            name: 'calc1',
            expression: 'isMinor({date_of_birth}, {start_date})',
          },
        ],
      });

      model.data = { date_of_birth: '2000-01-01' };
      model.setVariable('start_date', new Date('2008-01-01'));

      expect(model.calculatedValues[0].value).toBe(true);
    });
  });

  describe('isAdult', () => {
    // The function currently uses isMinor thus only the forwarding needs to be tested
    it('should return false, when person is a minor', () => {
      const model = new SurveyModel({
        elements: [{ name: 'date_of_birth', type: 'text' }],
        calculatedValues: [
          {
            name: 'calc1',
            expression: 'isAdult({date_of_birth}, {start_date})',
          },
        ],
      });

      model.data = { date_of_birth: '2000-01-01' };
      model.setVariable('start_date', '2008-01-01');

      expect(model.calculatedValues[0].value).toBe(false);
    });

    it('should return true, when person is an adult', () => {
      const model = new SurveyModel({
        elements: [{ name: 'date_of_birth', type: 'text' }],
        calculatedValues: [
          {
            name: 'calc1',
            expression: 'isAdult({date_of_birth}, {start_date})',
          },
        ],
      });

      model.data = { date_of_birth: '2000-01-01' };
      model.setVariable('start_date', '2018-01-01');

      expect(model.calculatedValues[0].value).toBe(true);
    });

    it('should return undefined, when date is missing', () => {
      const model = new SurveyModel({
        elements: [{ name: 'date_of_birth', type: 'text' }],
        calculatedValues: [
          {
            name: 'calc1',
            expression: 'isAdult({date_of_birth}, {start_date})',
          },
        ],
      });

      model.setVariable('start_date', '2008-01-01');

      expect(model.calculatedValues[0].value).toBe(undefined);
    });
  });

  describe('isWaitingList', () => {
    describe('free places per camp', () => {
      it('should return false when free places are positive', () => {
        const model = new SurveyModel({
          calculatedValues: [
            {
              name: 'calc1',
              expression: 'isWaitingList({free_places})',
            },
          ],
        });

        model.setVariable('free_places', 10);

        expect(model.calculatedValues[0].value).toBe(false);
      });

      it('should return true when free places are zero', () => {
        const model = new SurveyModel({
          calculatedValues: [
            {
              name: 'calc1',
              expression: 'isWaitingList({free_places})',
            },
          ],
        });

        model.setVariable('free_places', 0);

        expect(model.calculatedValues[0].value).toBe(true);
      });

      it('should return undefined when parameter is missing', () => {
        const model = new SurveyModel({
          calculatedValues: [
            {
              name: 'calc1',
              expression: 'isWaitingList()',
            },
          ],
        });

        expect(model.calculatedValues[0].value).toBe(undefined);
      });

      it('should return undefined when parameter is invalid', () => {
        const model = new SurveyModel({
          calculatedValues: [
            {
              name: 'calc1',
              expression: 'isWaitingList({free_places_1})',
            },
            {
              name: 'calc2',
              expression: 'isWaitingList({free_places_2})',
            },
          ],
        });

        model.setVariable('free_places_1', 'ten');

        expect(model.calculatedValues[0].value).toBe(undefined);
        expect(model.calculatedValues[1].value).toBe(undefined);
      });

      it('should ignore any further parameters', () => {
        const model = new SurveyModel({
          calculatedValues: [
            {
              name: 'calc1',
              expression: 'isWaitingList({free_places}, de)',
            },
          ],
        });

        model.setVariable('free_places', 10);

        expect(model.calculatedValues[0].value).toBe(false);
      });
    });

    describe('free places per country', () => {
      it('should return false when free places are positive', () => {
        const model = new SurveyModel({
          elements: [{ name: 'country', type: 'text' }],
          calculatedValues: [
            {
              name: 'calc1',
              expression: 'isWaitingList({free_places}, {country})',
            },
          ],
        });

        model.data = { country: 'de' };
        model.setVariable('free_places', {
          de: 10,
          fr: 0,
        });

        expect(model.calculatedValues[0].value).toBe(false);
      });

      it('should return true when free places are zero', () => {
        const model = new SurveyModel({
          elements: [{ name: 'country', type: 'text' }],
          calculatedValues: [
            {
              name: 'calc1',
              expression: 'isWaitingList({free_places}, {country})',
            },
          ],
        });

        model.data = { country: 'fr' };
        model.setVariable('free_places', {
          de: 10,
          fr: 0,
        });

        expect(model.calculatedValues[0].value).toBe(true);
      });

      it('should return true when country does not exist', () => {
        const model = new SurveyModel({
          elements: [{ name: 'country', type: 'text' }],
          calculatedValues: [
            {
              name: 'calc1',
              expression: 'isWaitingList({free_places}, {country})',
            },
          ],
        });

        model.data = { country: 'uk' };
        model.setVariable('free_places', {
          de: 10,
          fr: 0,
        });

        expect(model.calculatedValues[0].value).toBe(true);
      });

      it('should return undefined when country is missing', () => {
        const model = new SurveyModel({
          elements: [{ name: 'country', type: 'text' }],
          calculatedValues: [
            {
              name: 'calc1',
              expression: 'isWaitingList({free_places})',
            },
            {
              name: 'calc2',
              expression: 'isWaitingList({free_places}, {country})',
            },
          ],
        });

        model.setVariable('free_places', {
          de: 10,
          fr: 0,
        });

        expect(model.calculatedValues[0].value).toBe(undefined);
        expect(model.calculatedValues[1].value).toBe(undefined);
      });

      it('should return undefined when free places data is invalid', () => {
        const model = new SurveyModel({
          elements: [{ name: 'country', type: 'text' }],
          calculatedValues: [
            {
              name: 'calc1',
              expression: 'isWaitingList({free_places}, {country})',
            },
          ],
        });

        model.data = { country: 'de' };
        model.setVariable('free_places', {
          de: 'ten',
          fr: 0,
        });

        expect(model.calculatedValues[0].value).toBe(undefined);
      });
    });
  });

  describe('subtractYears', () => {
    it('should subtract years from a given date', () => {
      const model = new SurveyModel({
        elements: [{ name: 'date', type: 'text' }],
        calculatedValues: [
          {
            name: 'calc1',
            expression: 'subtractYears({date}, {years})',
          },
        ],
      });

      model.data = { date: '2010-01-01' };
      model.setVariable('years', 5);

      expect(model.calculatedValues[0].value).toBe('2005-01-01');
    });

    it('should subtract negative years from a given date', () => {
      const model = new SurveyModel({
        elements: [{ name: 'date', type: 'text' }],
        calculatedValues: [
          {
            name: 'calc1',
            expression: 'subtractYears({date}, {years})',
          },
        ],
      });

      model.data = { date: '2010-01-01' };
      model.setVariable('years', -5);

      expect(model.calculatedValues[0].value).toBe('2015-01-01');
    });

    it('should accept years as string', () => {
      const model = new SurveyModel({
        elements: [{ name: 'date', type: 'text' }],
        calculatedValues: [
          {
            name: 'calc1',
            expression: 'subtractYears({date}, {years})',
          },
        ],
      });

      model.data = { date: '2010-01-01' };
      model.setVariable('years', '5');

      expect(model.calculatedValues[0].value).toBe('2005-01-01');
    });

    it('should accept date as date', () => {
      const model = new SurveyModel({
        elements: [{ name: 'years', type: 'text' }],
        calculatedValues: [
          {
            name: 'calc1',
            expression: 'subtractYears({date}, {years})',
          },
        ],
      });

      model.data = { years: 5 };
      model.setVariable('date', new Date('2010-01-01'));

      expect(model.calculatedValues[0].value).toBe('2005-01-01');
    });

    it('should return undefined for invalid dates', () => {
      const model = new SurveyModel({
        elements: [{ name: 'date', type: 'text' }],
        calculatedValues: [
          {
            name: 'calc1',
            expression: 'subtractYears({date}, {years})',
          },
        ],
      });

      model.data = { date: 'invalid' };
      model.setVariable('years', 5);

      expect(model.calculatedValues[0].value).toBe(undefined);
    });

    it('should return undefined for invalid year', () => {
      const model = new SurveyModel({
        elements: [{ name: 'date', type: 'text' }],
        calculatedValues: [
          {
            name: 'calc1',
            expression: 'subtractYears({date}, {years})',
          },
        ],
      });

      model.data = { date: '2010-01-01' };
      model.setVariable('years', 'test');

      expect(model.calculatedValues[0].value).toBe(undefined);
    });

    it('should return undefined for pissing parameters', () => {
      const model = new SurveyModel({
        elements: [{ name: 'date', type: 'text' }],
        calculatedValues: [
          {
            name: 'calc1',
            expression: 'subtractYears({date})',
          },
        ],
      });

      model.data = { date: '2010-01-01' };

      expect(model.calculatedValues[0].value).toBe(undefined);
    });
  });

  describe('translate', () => {
    it('should return the translated value if the locale exists', () => {
      const model = new SurveyModel({
        calculatedValues: [
          {
            name: 'calc1',
            expression: 'translate({obj}, {locale})',
          },
        ],
      });

      model.setVariable('locale', 'de');
      model.setVariable('obj', {
        de: 'Hallo',
        fr: 'Salut',
      });

      expect(model.calculatedValues[0].value).toBe('Hallo');
    });

    it('should use the short locale if the long locale does not exists', () => {
      const model = new SurveyModel({
        calculatedValues: [
          {
            name: 'calc1',
            expression: 'translate({obj}, {locale})',
          },
        ],
      });

      model.setVariable('locale', 'de-DE');
      model.setVariable('obj', {
        de: 'Hallo',
        fr: 'Salut',
      });

      expect(model.calculatedValues[0].value).toBe('Hallo');
    });

    it('should use the fallback locale if the locale does not exists', () => {
      const model = new SurveyModel({
        calculatedValues: [
          {
            name: 'calc1',
            expression: 'translate({obj}, {locale}, {fallback})',
          },
        ],
      });

      model.setVariable('locale', 'it');
      model.setVariable('fallback', 'fr');
      model.setVariable('obj', {
        de: 'Hallo',
        fr: 'Salut',
      });

      expect(model.calculatedValues[0].value).toBe('Salut');
    });

    it('should use en if no fallback locale is defined', () => {
      const model = new SurveyModel({
        calculatedValues: [
          {
            name: 'calc1',
            expression: 'translate({obj}, {locale})',
          },
        ],
      });

      model.setVariable('locale', 'it');
      model.setVariable('obj', {
        de: 'Hallo',
        en: 'Hello',
      });

      expect(model.calculatedValues[0].value).toBe('Hello');
    });

    it('should return any value if fallback does not exist', () => {
      const model = new SurveyModel({
        calculatedValues: [
          {
            name: 'calc1',
            expression: 'translate({obj}, {locale})',
          },
        ],
      });

      model.setVariable('locale', 'it');
      model.setVariable('obj', {
        de: 'Hallo',
        fr: 'Salut',
      });

      expect(model.calculatedValues[0].value).toBe('Hallo');
    });

    it('should return the value if the value is a string', () => {
      const model = new SurveyModel({
        calculatedValues: [
          {
            name: 'calc1',
            expression: 'translate({obj}, {locale})',
          },
        ],
      });

      model.setVariable('locale', 'de');
      model.setVariable('obj', 'hello');

      expect(model.calculatedValues[0].value).toBe('hello');
    });

    it('should return undefined when the value is missing', () => {
      const model = new SurveyModel({
        calculatedValues: [
          {
            name: 'calc1',
            expression: 'translate()',
          },
          {
            name: 'calc2',
            expression: 'translate({obj})',
          },
        ],
      });

      expect(model.calculatedValues[0].value).toBe(undefined);
      expect(model.calculatedValues[1].value).toBe(undefined);
    });

    it('should return undefined if the locale is missing', () => {
      const model = new SurveyModel({
        calculatedValues: [
          {
            name: 'calc1',
            expression: 'translate({obj})',
          },
          {
            name: 'calc2',
            expression: 'translate({obj}, {locale})',
          },
        ],
      });

      model.setVariable('obj', {
        de: 'Hallo',
        fr: 'Salut',
      });

      expect(model.calculatedValues[0].value).toBe(undefined);
      expect(model.calculatedValues[1].value).toBe(undefined);
    });

    it('should return undefined if the locale is invalid', () => {
      const model = new SurveyModel({
        calculatedValues: [
          {
            name: 'calc1',
            expression: 'translate({obj}, {locale})',
          },
        ],
      });

      model.setVariable('locale', 1);
      model.setVariable('obj', {
        de: 'Hallo',
        fr: 'Salut',
      });

      expect(model.calculatedValues[0].value).toBe(undefined);
    });
  });

  describe('htmlDate', () => {
    it('should return a date string in html format', () => {
      const model = new SurveyModel({
        calculatedValues: [
          {
            name: 'calc1',
            expression: 'htmlDate({date})',
          },
        ],
      });

      model.setVariable('date', new Date('2000-01-01'));

      expect(model.calculatedValues[0].value).toBe('2000-01-01');
    });

    it('should return a date string when the input is already a data string', () => {
      const model = new SurveyModel({
        calculatedValues: [
          {
            name: 'calc1',
            expression: 'htmlDate({date})',
          },
        ],
      });

      model.setVariable('date', '2000-01-01');

      expect(model.calculatedValues[0].value).toBe('2000-01-01');
    });

    it('should return undefined when the input parameter is missing', () => {
      const model = new SurveyModel({
        calculatedValues: [
          {
            name: 'calc1',
            expression: 'htmlDate()',
          },
        ],
      });

      expect(model.calculatedValues[0].value).toBe(undefined);
    });

    it('should return undefined when the input is not a date', () => {
      const model = new SurveyModel({
        calculatedValues: [
          {
            name: 'calc1',
            expression: 'htmlDate({date})',
          },
        ],
      });

      model.setVariable('date', 'invalid');

      expect(model.calculatedValues[0].value).toBe(undefined);
    });
  });

  describe.todo('joinStrings');

  describe.todo('objectValues');
});
