import { describe, expect, it } from 'vitest';
import {
  FIELD_NAME_PATTERN,
  MAX_FIELD_LENGTH,
  fieldFromParts,
} from '@/utils/fileField';

describe('fieldFromParts', () => {
  it('joins short parts unchanged', () => {
    expect(fieldFromParts(['image', 'photo', 'imageLink'])).toBe(
      'image_photo_imagelink',
    );
  });

  it('skips missing parts', () => {
    expect(fieldFromParts(['theme', undefined, 'backgroundImage'])).toBe(
      'theme_backgroundimage',
    );
  });

  it('turns user-chosen names into a valid field', () => {
    const field = fieldFromParts(['image', 'Photo of Child', 'imageLink']);

    expect(field).toBe('image_photo-of-child_imagelink');
    expect(field).toMatch(FIELD_NAME_PATTERN);
  });

  it('leaves room for a version suffix on long names', () => {
    const field = fieldFromParts([
      'imagepicker',
      'a_really_long_question_name_for_pictures',
      'imageLink',
    ]);

    expect(`${field}-99`.length).toBeLessThanOrEqual(MAX_FIELD_LENGTH);
    expect(field).toMatch(FIELD_NAME_PATTERN);
  });

  it('keeps long names that share a prefix apart', () => {
    const prefix = 'a_really_long_question_name_for_pictures';

    expect(fieldFromParts(['image', `${prefix}_one`, 'imageLink'])).not.toBe(
      fieldFromParts(['image', `${prefix}_two`, 'imageLink']),
    );
  });
});
