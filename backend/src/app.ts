import express from 'express';
import cors from 'cors';
import helmet, { type HelmetOptions } from 'helmet';
import compression from 'compression';
import config from '#config/index';
import { serverErrorHandler } from '#core/morgan';
import { errorConverter, errorHandler } from '#middlewares/error.middleware';
import cookieParser from 'cookie-parser';
import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';
import staticRoutes from '#routes/static';
import apiRouter from '#routes/api';
import { resolve } from '#core/ioc/container';
import { CaptchaService } from '#core/captcha/captcha.service';

function helmetOptions(): HelmetOptions {
  const captcha = resolve(CaptchaService).cspSources;
  if (!captcha) {
    return {};
  }

  return {
    contentSecurityPolicy: {
      directives: {
        scriptSrc: ["'self'", ...captcha.scriptSrc],
        frameSrc: ["'self'", ...captcha.frameSrc],
      },
    },
  };
}

export function createApp() {
  const app = express();

  // Errors are always logged. Successful requests are logged inside the routers if required
  app.use(serverErrorHandler);

  // set security HTTP headers
  app.use(helmet(helmetOptions()));

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
      origin: config.origin,
      credentials: true,
    }),
  );

  // use forwarded ip address from reverse proxy - required for throttling and logging
  app.enable('trust proxy');

  // register api routes
  app.use('/api/v1', apiRouter);

  // send back a 404 error for any unknown api request
  app.use('/api', (_req, _res, next) => {
    next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
  });

  app.use(staticRoutes);

  // convert error to ApiError, if needed
  app.use(errorConverter);

  // handle error
  app.use(errorHandler);

  return app;
}
