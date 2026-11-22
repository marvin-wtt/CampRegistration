import type { Question, SurveyModel } from 'survey-core';
import { readAsDataURL } from '@/utils/readAsDataURL';

/**
 * A response stores each file by the name the server gave the upload; the
 * survey works with file objects it can preview. These convert between the
 * two at the edges: on load, on upload and before submitting.
 */

export interface FileStorageOptions {
  /** Uploads a file; resolves to its stored name. */
  upload?: ((file: File) => Promise<string>) | undefined;
  errorText: (error: unknown) => string;
  /** Shown when the form takes no uploads. */
  unavailableText: string;
}

interface StoredFile {
  name: string;
  type: string;
  content: string;
}

function fileQuestions(survey: SurveyModel): Question[] {
  return survey
    .getAllQuestions(false, undefined, true)
    .filter((question) => question.getType() === 'file');
}

// A file question holds one value or a list of them.
function mapFileValues(
  survey: SurveyModel,
  map: (value: unknown) => unknown,
): void {
  for (const question of fileQuestions(survey)) {
    const value: unknown = question.value;
    question.value = Array.isArray(value) ? value.map(map) : map(value);
  }
}

function isFile(file: unknown): file is Pick<File, 'name'> {
  return file != null && typeof file === 'object' && 'name' in file;
}

/** Uploads what the person picks; nothing is ever deleted from here. */
export function attachFileStorage(
  survey: SurveyModel,
  options: FileStorageOptions,
): void {
  survey.onUploadFiles.add(async (_, event) => {
    const upload = options.upload;
    if (!upload) {
      event.callback([], [options.unavailableText]);
      return;
    }

    try {
      // The stored value is the server's name; the local copy is only read
      // back so the question can preview it.
      const files = await Promise.all(
        event.files.map(async (file) => ({
          file: { name: await upload(file), type: file.type, size: file.size },
          content: await readAsDataURL(file),
        })),
      );
      event.callback(files);
    } catch (e: unknown) {
      event.callback([], [options.errorText(e)]);
    }
  });

  // The person may not delete stored files; a cleanup job removes the
  // uploads no response references.
  survey.onClearFiles.add((_, event) => {
    event.callback('success');
  });
}

/** Turns the stored names of a loaded response into previewable files. */
export function showStoredFiles(
  survey: SurveyModel,
  fileUrl: (name: string) => string,
): void {
  mapFileValues(survey, (value): unknown =>
    typeof value === 'string'
      ? ({
          name: value,
          type: '',
          content: /^https?:\/\//.test(value) ? value : fileUrl(value),
        } satisfies StoredFile)
      : value,
  );
}

/** Turns the survey's files back into the stored names, to submit them. */
export function toStoredFiles(survey: SurveyModel): void {
  mapFileValues(survey, (value) => (isFile(value) ? value.name : value));
}
