import winston from 'winston';
import 'winston-daily-rotate-file';
import config from '#config/index';
import { appPath } from '#utils/paths';
import { ErrorTrackingTransport } from '#core/errorTracking/errorTracking.transport';

const enumerateErrorFormat = winston.format((info) => {
  if (info instanceof Error) {
    Object.assign(info, { message: info.stack });
  }
  return info;
});

const isDevEnv = config.env === 'development';

const devFormat = winston.format.combine(
  enumerateErrorFormat(),
  winston.format.colorize(),
  winston.format.splat(),
  winston.format.timestamp(),
  winston.format.printf(
    ({ level, message, timestamp }) =>
      `${String(timestamp)} ${level}: ${String(message)}`,
  ),
);

const prodFormat = winston.format.combine(
  enumerateErrorFormat(),
  winston.format.splat(),
  winston.format.timestamp(),
  winston.format.json(),
);

const fileTransport = new winston.transports.DailyRotateFile({
  filename: '%DATE%-app.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  zippedArchive: true,
  dirname: appPath('logs'),
});

const fileErrorTransport = new winston.transports.DailyRotateFile({
  level: 'error',
  filename: '%DATE%-app-error.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  zippedArchive: true,
  dirname: appPath('logs'),
});

const consoleTransport = new winston.transports.Console({
  stderrLevels: ['error'],
});

// Inert until ErrorTrackingModule configures a tracker (see #modules) — safe
// to always attach.
const errorTrackingTransport = new ErrorTrackingTransport({ level: 'error' });

const logger = winston.createLogger({
  level: config.log.level ?? (isDevEnv ? 'debug' : 'info'),
  format: isDevEnv ? devFormat : prodFormat,
  transports: [
    consoleTransport,
    fileTransport,
    fileErrorTransport,
    errorTrackingTransport,
  ],
});

export default logger;
