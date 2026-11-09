import type { SurveyCreatorModel } from 'survey-creator-core';
import { type Base, QuestionMatrixDynamicModel, Serializer } from 'survey-core';
import { PAYMENT_AMOUNT_TAG } from '@camp-registration/common/utils';

// Prices count only on questions tagged `payment_amount`
// (`extractPaymentAmounts`), so the editor offers them only there.
function isPriced(obj: Base): boolean {
  return obj.getPropertyValue('eventDataType') === PAYMENT_AMOUNT_TAG;
}

/**
 * Shows the price of a boolean and the price column of choices only once the
 * question is tagged, and follows the tag while the question stays selected.
 */
export function showPricesOnlyWhenTagged(creator: SurveyCreatorModel): void {
  const booleanPrice = Serializer.getProperty('boolean', 'price');
  if (booleanPrice) {
    booleanPrice.visibleIf = isPriced;
  }

  // A column's `visibleIf` is evaluated without its question, so the choices
  // table is adjusted once the property grid exists for the question.
  creator.onSurveyInstanceCreated.add((_, options) => {
    const element = options.element;
    if (options.area !== 'property-grid' || !element) {
      return;
    }
    const choices = options.survey.getQuestionByName('choices');
    const column =
      choices instanceof QuestionMatrixDynamicModel
        ? choices.getColumnByName('price')
        : null;
    if (!column) {
      return;
    }

    const update = () => {
      column.visible = isPriced(element);
    };
    update();
    // Keyed, so selecting the question again replaces the listener.
    element.registerFunctionOnPropertyValueChanged(
      'eventDataType',
      update,
      'priceColumn',
    );
  });
}
