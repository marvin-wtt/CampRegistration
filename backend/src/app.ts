import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import passport from "passport";
import apiRoutes from "./routes/api";
import config from "./config";
import morgan from "./config/morgan";
import { errorConverter, errorHandler } from "./middlewares";
import { anonymousStrategy, jwtStrategy } from "./config/passport";
import cookieParser from "cookie-parser";
import { initI18n } from "config/i18n";
import { startJobs } from "jobs";
import path from "path";

// TODO https://expressjs.com/en/advanced/best-practice-security.html#use-tls

const app = express();

if (config.env !== "test") {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

// set security HTTP headers
app.use(helmet());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// Parse json body as json
app.use(express.json());

// Use cookies
app.use(cookieParser());

// // gzip compression
app.use(compression());

// enable cors
app.use(
  cors({
    origin: config.origin || "*",
    credentials: true,
  }),
);
app.options("*", cors());

// authentication
app.use(passport.initialize());
passport.use(jwtStrategy);
passport.use(anonymousStrategy);

// localization
initI18n();

// api routes
app.use("/api", apiRoutes);
// static content
app.use(express.static("public"));
// Serve frontend content
// TODO Is there a better way to load the files?
app.use(
  express.static(path.join(__dirname, "..", "..", "frontend", "dist", "spa")),
);

// Redirect all requests to SPA
app.use((req, res) => {
  res.redirect("/");
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

// Start jobs
startJobs();

export default app;
