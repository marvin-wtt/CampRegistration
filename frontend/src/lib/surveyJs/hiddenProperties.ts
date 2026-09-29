import { type Base, Serializer } from 'survey-core';

function hideProperty(className: string, propertyName: string) {
  const property = Serializer.getProperty(className, propertyName);
  if (!property) {
    // eslint-disable-next-line no-console
    console.warn(`SurveyJS property not found: ${className}.${propertyName}`);
    return;
  }

  property.visible = false;
}

// Editor-wide, whatever the mode: settings with no place on a registration
// form, or that the app manages elsewhere.
export function hideIrrelevantProperties(): void {
  // Hide the logo as it should be managed by the files settings page only
  hideProperty('survey', 'logo');
  hideProperty('survey', 'cookieName');
  hideProperty('survey', 'widthMode');
  hideProperty('survey', 'completedBeforeHtml');
  hideProperty('survey', 'readOnly');
  hideProperty('survey', 'partialSendEnabled');
  hideProperty('survey', 'questionOrder');
  // Quiz features, meaningless on a registration form in any mode.
  hideProperty('survey', 'showTimer');
  hideProperty('survey', 'timerLocation');
  hideProperty('survey', 'timeLimit');
  hideProperty('survey', 'timeLimitPerPage');
  hideProperty('survey', 'timerInfoMode');
  hideProperty('question', 'correctAnswer');

  // Content-only elements collect no answer that could be mapped.
  const eventDataType = Serializer.getProperty('question', 'eventDataType');
  if (eventDataType) {
    eventDataType.visibleIf = (obj: Base) =>
      !['html', 'image'].includes(obj.getType());
  }
}
