import ejs from "ejs";
import { join } from "path";
import mjml2html from "mjml";

interface RenderOptions {
  layout?: string;
  directory?: string;
}

const renderMjml = (mjml: string): string => {
  const { html, errors } = mjml2html(mjml);

  // TODO Precompile it
  if (errors && errors.length > 0) {
    throw new Error(errors[0].message);
  }

  return html;
};

export const render = async (
  template: string,
  data?: Record<string, unknown>,
  options?: RenderOptions,
): Promise<string> => {
  // TODO Continue
  const filePath =
    join(__dirname, "..", "views", ...template.split("/")) + ".ejs";

  // const content = await ejs.renderFile(
  //   filePath,
  //   {
  //     data,
  //   },
  //   {
  //     async: false,
  //   }
  // );

  // TODO Get directory from path
  const layoutPath =
    join(__dirname, "..", "views", "emails", "layout") + ".ejs";
  const layout = await ejs.renderFile(layoutPath, {
    // content,
    meta: {
      copyright: "2023 Ballaeron e.V.", // TODO Who is the publisher?
      imprintUrl: "",
      contactUrl: "",
    },
  });

  return renderMjml(layout);
};
