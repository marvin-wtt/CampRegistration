import { HorizontalAlign, SurveyPDF } from 'survey-pdf';
import { Spacious } from 'survey-pdf/layouts';
import { buildMd3LiteralTheme } from '@/lib/surveyJs/theme';
import { createMarkdownConverter } from '@/utils/markdown';
import { safeFileName } from '@/utils/safeFileName';
import { setVariables } from '@camp-registration/common/form';
import type {
  EventDetails,
  Registration,
} from '@camp-registration/common/entities';
import type { SurveyModel } from 'survey-core';

interface RegistrationPdfOptions {
  event: EventDetails;
  registration: Registration;
  fileUrl: (slot: string) => string;
}

const registrationIdLabel: Record<string, string> = {
  en: 'Registration ID',
  de: 'Registrierungs-ID',
  fr: "Numéro d'inscription",
  pl: 'ID rejestracji',
  cs: 'ID registrace',
};

type DynamicTextHandler = Parameters<
  SurveyModel['onProcessDynamicText']['add']
>[0];

function fileDynamicTextProcessor(
  resolver: (slot: string) => string,
): DynamicTextHandler {
  return (_sender, options) => {
    if (options.isExists) {
      return;
    }
    if (!options.name.startsWith('_file.')) {
      return;
    }
    const slot = options.name.slice('_file.'.length);
    options.value = resolver(slot);
  };
}

function buildSurveyPdf(options: RegistrationPdfOptions): SurveyPDF {
  const { event, registration, fileUrl } = options;

  const surveyPDF = new SurveyPDF(event.form);
  surveyPDF.data = registration.data;
  surveyPDF.locale = registration.locale;
  // survey-pdf resolves CSS on a detached div that never carries the
  // `.sjs-theme-overrides` class, so the adapter stylesheet cannot reach it —
  // the same token map is handed over as an object instead. Pinned to the light
  // palette so a viewer in dark mode does not print a dark form. Only colors
  // reach the PDF, hence the separate layout preset below.
  surveyPDF.applyTheme(buildMd3LiteralTheme('light'));
  surveyPDF.applyLayout(Spacious);
  surveyPDF.readOnly = true;

  const mdConverter = createMarkdownConverter();
  surveyPDF.onTextMarkdown.add((_, textOptions) => {
    textOptions.html = mdConverter.renderInline(textOptions.text);
  });
  surveyPDF.onProcessDynamicText.add(fileDynamicTextProcessor(fileUrl));

  const label =
    registrationIdLabel[registration.locale] ?? registrationIdLabel.en;
  surveyPDF.onRenderFooter.add((_, canvas) => {
    canvas.drawText({
      text: `${label}: ${registration.id}`,
      fontSize: 8,
      horizontalAlign: HorizontalAlign.Left,
      margins: { left: 12 },
    });
  });

  setVariables(surveyPDF, event);

  return surveyPDF;
}

/**
 * The backend already derives first/last name onto `computedData` for
 * exactly this kind of display purpose, so the saved file is distinguishable
 * when a parent registers several children. Both are optional, hence the
 * fallback.
 */
function registrationFileName(registration: Registration): string {
  const { firstName, lastName } = registration.computedData;

  return safeFileName(
    ['Registration', lastName, firstName]
      .filter((part) => part != null && part !== '')
      .join('_'),
    'Registration',
  );
}

/** Generates the PDF and hands it to the browser as a download. */
export async function downloadRegistrationPdf(
  options: RegistrationPdfOptions,
): Promise<void> {
  const surveyPDF = buildSurveyPdf(options);

  await surveyPDF.save(`${registrationFileName(options.registration)}.pdf`);
}
