import type { SurveyCreatorModel } from 'survey-creator-core';
import { Base, type ITheme, Serializer } from 'survey-core';
import { FILE_VARIABLE } from '@camp-registration/common/form';
import { fieldFromParts } from '@/utils/fileField';

export interface CreatorFileOptions {
  /** Stores the file as one of the event's; resolves to its slot. */
  upload: (file: File) => Promise<string>;
  /** Where a slot's file is served, for properties used verbatim. */
  slotUrl: (slot: string) => string;
  /** Lets the person pick event files for a field; empty when cancelled. */
  choose: (field: string) => Promise<File[]>;
}

// Only localizable strings (logo, image links) go through text processing, so
// only they can hold a `{_file.<slot>}` placeholder. Everything else — theme
// and header backgrounds among them — is used verbatim and needs a real URL.
function isTextProcessed(element: Base | ITheme, propertyName: string) {
  return (
    element instanceof Base &&
    !!Serializer.findProperty(element.getType(), propertyName)?.isLocalizable
  );
}

// Named survey elements (pages, panels, questions) share their type with
// every other instance of it, so `elementType` alone would give every page's
// backgroundImage the same field. Theme/header targets have no `name` and
// stay one field per survey, which is what's wanted there anyway.
function elementInstanceName(element: Base | ITheme): string | undefined {
  return 'name' in element && typeof element.name === 'string'
    ? element.name
    : undefined;
}

/** Uploads and picks the editor's images as files of the event. */
export function attachCreatorFiles(
  creator: SurveyCreatorModel,
  options: CreatorFileOptions,
): void {
  creator.onUploadFile.add((_, event) => {
    const file = event.files[0];
    if (!file) {
      event.callback('error', '');
      return;
    }

    const propertyName = event.propertyName.toString();
    options
      .upload(file)
      .then((slot) =>
        event.callback(
          'success',
          isTextProcessed(event.element, propertyName)
            ? `{${FILE_VARIABLE}.${slot}}`
            : options.slotUrl(slot),
        ),
      )
      .catch(() => event.callback('error', ''));
  });

  creator.onOpenFileChooser.add((_, event) => {
    const field = fieldFromParts([
      event.elementType.toString(),
      elementInstanceName(event.element),
      event.propertyName.toString(),
    ]);

    options
      .choose(field)
      .then((files) => event.callback(files))
      .catch(() => event.callback([]));
  });
}
