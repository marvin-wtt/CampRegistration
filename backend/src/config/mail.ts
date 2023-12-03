import nodemailer from "nodemailer";
import config from "./index";
import logger from "./logger";
import hbs from "nodemailer-express-handlebars";
import { create } from "express-handlebars";
import i18n from "@/config/i18n";
import path from "path";

const transport = nodemailer.createTransport(config.email.smtp);
/* c8 ignore next 10 */
if (config.env !== "test") {
  transport
    .verify()
    .then(() => logger.info("Connected to email server"))
    .catch(() =>
      logger.warn(
        "Unable to connect to email server. Make sure you have configured the SMTP options in .env",
      ),
    );
}

const viewsPath = path.join(__dirname, "..", "views", "emails");

const options = {
  extName: ".hbs",
  viewEngine: create({
    partialsDir: path.join(viewsPath, "partials"),
    layoutsDir: undefined,
    defaultLayout: false,
    helpers: {
      t: i18n.t,
    },
  }),
  viewPath: viewsPath,
};

transport.use("compile", hbs(options));

export default transport as hbs.HbsTransporter;
