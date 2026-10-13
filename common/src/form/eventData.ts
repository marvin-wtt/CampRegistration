import type { SurveyModel } from 'survey-core';

/**
 * The answers of the questions tagged with an `eventDataType`, by tag. Shared
 * so the registration form computes from the same values the server stores.
 */
export function extractEventData(
  survey: SurveyModel,
): Record<string, unknown[]> {
  const plain = survey.getPlainData({
    includeEmpty: true,
    includeValues: true,
    calculations: [{ propertyName: 'eventDataType' }],
  });

  const eventData: Record<string, unknown[]> = {};
  for (const entry of plain) {
    const tag: unknown = entry.eventDataType;
    if (typeof tag !== 'string' || !tag) {
      continue;
    }

    // Undefined is not accepted by prisma and must be replaced with null
    (eventData[tag] ??= []).push(entry.value ?? null);
  }

  return eventData;
}
