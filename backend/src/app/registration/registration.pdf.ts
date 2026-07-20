import { SurveyPDF } from 'survey-pdf';
import { type ITheme } from 'survey-core';
import { createMarkdownConverter } from '@camp-registration/common/utils';
import { generateApiUrl } from '#utils/url';
import type { CampWithFreePlaces } from '#app/camp/camp.types';
import type { Registration } from '#generated/prisma/client';
import jsdom from 'jsdom';
import {
  setVariables,
  fileDynamicTextProcessor,
} from '@camp-registration/common/form';
import { Mutex } from 'async-mutex';

import 'survey-core/i18n';

const pdfMutex = new Mutex();

export function generatePDF(
  camp: CampWithFreePlaces,
  registration: Registration,
): Promise<ArrayBuffer> {
  return pdfMutex.runExclusive(() => runExportPDF(camp, registration));
}

async function runExportPDF(
  camp: CampWithFreePlaces,
  registration: Registration,
): Promise<ArrayBuffer> {
  const { window } = new jsdom.JSDOM();

  const prevWindow = global.window;
  const prevDocument = global.document;

  // @ts-expect-error Required for survey-pdf, which expects a browser environment
  global.window = window;
  global.document = window.document;

  try {
    const surveyPDF = new SurveyPDF(camp.form);
    surveyPDF.data = registration.data;
    surveyPDF.locale = registration.locale;
    surveyPDF.applyTheme(camp.themes.light as ITheme);
    surveyPDF.readOnly = true;

    const mdConverter = createMarkdownConverter();
    surveyPDF.onTextMarkdown.add((_, options) => {
      options.html = mdConverter.renderInline(options.text);
    });
    surveyPDF.onProcessDynamicText.add(
      fileDynamicTextProcessor((slot) =>
        generateApiUrl(['camps', camp.id, 'files', slot]),
      ),
    );

    setVariables(surveyPDF, camp);

    return await surveyPDF.raw('arraybuffer');
  } finally {
    global.window = prevWindow;
    global.document = prevDocument;
  }
}
