import { IDocOptions, SurveyPDF } from 'survey-pdf';
import Showdown from 'showdown';
import { setVariables } from '@camp-registration/common/form';
import { Camp, Registration } from '@prisma/client';
import { SurveyModel } from 'survey-core';

const markdownConverter = new Showdown.Converter();

// TODO Set license

// FIXME Image urls throw error
// FIXME Umlauts are not represented correctly
export const printForm = async (camp: Camp, registration: Registration) => {
  const pdfDocOptions: IDocOptions = {
    format: 'a4',
    orientation: 'p',
  };

  const surveyPdf = new SurveyPDF(camp.form, pdfDocOptions);
  surveyPdf.mode = 'display';
  surveyPdf.data = registration.data;
  surveyPdf.data = registration.locale;

  setVariables(surveyPdf as unknown as SurveyModel, camp);

  // FIXME Find modeJS alternative
  // surveyPdf.onTextMarkdown.add((_, options) => {
  //   const str = markdownConverter.makeHtml(options.text);
  //   // Remove root paragraphs <p></p>
  //   options.html = str.substring(3, str.length - 4);
  // });

  return surveyPdf.raw();
};
