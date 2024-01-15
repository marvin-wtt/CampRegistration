import { beforeEach, describe, expect, it } from 'vitest';
import { SurveyModel } from 'survey-core';
import { fakeCampData } from '../../util/faker';
import { setVariables } from '../../../src/form';
import '../../../src/form';

describe('questions', () => {
  describe('date of birth', () => {
    interface Context {
      survey: SurveyModel;
    }

    beforeEach<Context>((context) => {
      context.survey = new SurveyModel({
        elements: [
          {
            name: 'test',
            type: 'date_of_birth',
          },
        ],
      });

      const data = fakeCampData({
        minAge: 10,
        maxAge: 11,
        startAt: new Date('2020-01-01'),
        endAt: new Date('2020-01-02'),
      });

      context.survey.locale = 'en';
      setVariables(context.survey, data);
    });

    it<Context>('should be valid or a date within the age limit', (context) => {
      context.survey.data = {
        test: '2010-01-01',
      };
      expect(context.survey.validate()).toBeTruthy();

      context.survey.data = {
        test: '2008-01-02',
      };
      expect(context.survey.validate()).toBeTruthy();
    });

    it<Context>('should throw an error is the date is too early', (context) => {
      context.survey.data = {
        test: '2010-01-02',
      };

      expect(context.survey.validate()).toBeFalsy();
    });

    it<Context>('should throw an error is the date is too late', (context) => {
      context.survey.data = {
        test: '2008-01-01',
      };

      expect(context.survey.validate()).toBeFalsy();
    });
  });
});
