/**
 * Builds a registrant's copy of their submission as a PDF, in the browser.
 *
 * This deliberately runs client-side: the data is already in the tab that
 * submitted it, so producing the copy here means a registration — which may
 * contain health data — never has to travel back out over email or through an
 * unauthenticated download endpoint. `survey-pdf` is a browser library, so this
 * is also where it natively belongs.
 *
 * The module is heavy (survey-pdf pulls in jsPDF) and is therefore only ever
 * reached through a dynamic import from the download action.
 */
import { SurveyPDF } from 'survey-pdf';
import { Spacious } from 'survey-pdf/layouts';
import { buildMd3LiteralTheme } from '@/lib/surveyJs/theme';
import {
  createMarkdownConverter,
  safeFileName,
} from '@camp-registration/common/utils';
import {
  setVariables,
  fileDynamicTextProcessor,
} from '@camp-registration/common/form';
import type { CampDetails } from '@camp-registration/common/entities';

interface RegistrationPdfOptions {
  camp: CampDetails;
  data: Record<string, unknown>;
  locale: string;
  /** Resolves a camp file slot to a URL, for `{_file.<slot>}` placeholders. */
  fileUrl: (slot: string) => string;
}

function buildSurveyPdf(options: RegistrationPdfOptions): SurveyPDF {
  const { camp, data, locale, fileUrl } = options;

  const surveyPDF = new SurveyPDF(camp.form);
  surveyPDF.data = data;
  surveyPDF.locale = locale;
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

  setVariables(surveyPDF, camp);

  return surveyPDF;
}

/**
 * Reads the participant's name off the questions the camp tagged with
 * `campDataType`, so the saved file is distinguishable when a parent registers
 * several children. The tags are optional, hence the fallback.
 */
function registrationFileName(surveyPDF: SurveyPDF): string {
  const byTag = (tag: string): string | undefined => {
    const question = surveyPDF
      .getAllQuestions(false, undefined, true)
      .find((q) => q.getPropertyValue('campDataType') === tag);

    return typeof question?.value === 'string' ? question.value : undefined;
  };

  return safeFileName(
    ['Registration', byTag('last_name'), byTag('first_name')]
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

  await surveyPDF.save(`${registrationFileName(surveyPDF)}.pdf`);
}
