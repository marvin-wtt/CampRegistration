import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import passport from 'passport';
import router from '#routes/index';
import config from '#config/index';
import morgan from '#core/morgan';
import { errorConverter, errorHandler } from '#middlewares/error.middleware';
import { anonymousStrategy, jwtStrategy } from '#core/passport';
import cookieParser from 'cookie-parser';
import { initI18n } from '#core/i18n';
import { startJobs } from '#jobs/index';

const app = express();

// Errors are always logged. Successful requests are logged inside the routers if required
app.use(morgan.errorHandler);

// set security HTTP headers
app.use(helmet());

// reduce fingerprint -prevents express from sending the header
app.disable('x-powered-by');

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
    origin: config.origin || '*',
    credentials: true,
  }),
);
app.options('*splat', cors());

// use forwarded ip address from reverse proxy - required for throttling and logging
app.enable('trust proxy');

// authentication
app.use(passport.initialize());
passport.use(jwtStrategy);
passport.use(anonymousStrategy);

// localization
initI18n();

// routes
app.use(router);

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

// Start jobs
startJobs();

export default app;
