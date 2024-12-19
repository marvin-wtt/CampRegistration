import {
  BtnAnnotation,
  FieldAnnotation,
} from 'components/campManagement/tools/partispantList/FGYOParticipationList';
import * as pdfJS from 'pdfjs-dist';
import pdfJSWorkerURL from 'pdfjs-dist/build/pdf.worker?url';

pdfJS.GlobalWorkerOptions.workerSrc = pdfJSWorkerURL;

export async function pdfUtils(buffer: ArrayBuffer) {
  const loadingTask = pdfJS.getDocument(buffer);
  const pdf = await loadingTask.promise;
  const annotations = await getAnnotations();

  async function getAnnotations(): Promise<unknown[]> {
    const annotations: unknown[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const pageAnnotations = await page.getAnnotations();
      annotations.push(...pageAnnotations);
    }

    return annotations;
  }

  const setButton = (name: string, value: string | number) => {
    const annotation = annotations
      .filter(isButtonAnnotation)
      .find(
        (annotation) =>
          annotation.fieldName === name && annotation.buttonValue === value,
      );

    if (annotation) {
      pdf.annotationStorage.setValue(annotation.id, { value });
    }
  };

  const setField = (name: string, value?: string | number) => {
    const annotation = annotations
      .filter(isFieldAnnotation)
      .find((annotation) => annotation.fieldName === name);

    if (typeof value === 'number') {
      value = value.toString();
    }

    if (annotation) {
      pdf.annotationStorage.setValue(annotation.id, { value });
    }
  };

  async function save() {
    return pdf.saveDocument();
  }

  return {
    setButton,
    setField,
    save,
  };
}

export const isButtonAnnotation = (
  annotation: unknown,
): annotation is BtnAnnotation => {
  return (
    annotation != null &&
    typeof annotation === 'object' &&
    'fieldType' in annotation &&
    annotation.fieldType === 'Btn'
  );
};

export const isFieldAnnotation = (
  annotation: unknown,
): annotation is FieldAnnotation => {
  return (
    annotation != null &&
    typeof annotation === 'object' &&
    'fieldName' in annotation &&
    typeof annotation.fieldName === 'string' &&
    'id' in annotation &&
    typeof annotation.id === 'string'
  );
};
