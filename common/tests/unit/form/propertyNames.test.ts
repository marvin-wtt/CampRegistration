import { describe, expect, it } from 'vitest';
import { Serializer } from 'survey-core';
// The plain list, not `src/form/index.js`: that registers the properties, and
// this file must see survey-core as it ships.
import properties from '../../../src/form/properties/index.js';

// Registration removes a property of the same name first, so a SurveyJS
// upgrade that adds one of these names would silently lose its own.
describe('custom survey properties', () => {
  it.each(
    properties.map(({ className, propertyInfo }) => ({
      className,
      name: propertyInfo.name?.split(':')[0] ?? '',
    })),
  )('$name on $className is not defined by SurveyJS', ({ className, name }) => {
    expect(Serializer.findProperty(className, name)).toBeUndefined();
  });
});
