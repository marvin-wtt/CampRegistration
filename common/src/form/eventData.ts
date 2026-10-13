import type { SurveyModel } from 'survey-core';

interface TaggedPlainDataEntry {
  value: unknown;
  eventDataType?: unknown;
  data?: TaggedPlainDataEntry[];
}

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
  // The survey lists only top-level questions; those of a dynamic panel or
  // matrix sit in the `data` of its panel and row entries.
  const collect = (entries: TaggedPlainDataEntry[]) => {
    for (const entry of entries) {
      const tag = entry.eventDataType;
      if (typeof tag !== 'string' || !tag) {
        collect(entry.data ?? []);
        continue;
      }

      // Undefined is not accepted by prisma and must be replaced with null
      (eventData[tag] ??= []).push(entry.value ?? null);
    }
  };
  collect(plain);

  return eventData;
}
