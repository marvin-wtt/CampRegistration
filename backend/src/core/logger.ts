import winston from 'winston';
import 'winston-daily-rotate-file';
import config from '#config/index';
import { appPath } from '#utils/paths';

const enumerateErrorFormat = winston.format((info) => {
  if (info instanceof Error) {
    Object.assign(info, { message: info.stack });
  }
  return info;
});

const fileTransport = new winston.transports.DailyRotateFile({
  filename: '%DATE%-app.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  dirname: appPath('logs'),
});

const fileErrorTransport = new winston.transports.DailyRotateFile({
  level: 'error',
  filename: '%DATE%-app-error.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  dirname: appPath('logs'),
});

const consoleTransport = new winston.transports.Console({
  stderrLevels: ['error'],
});

const isDevEnv = config.env === 'development';

const logger = winston.createLogger({
  level: isDevEnv ? 'debug' : 'info',
  format: winston.format.combine(
    enumerateErrorFormat(),
    isDevEnv ? winston.format.colorize() : winston.format.uncolorize(),
    winston.format.splat(),
    winston.format.timestamp(),
    winston.format.printf(
      ({ level, message, timestamp }) =>
        `${String(timestamp)} ${level}: ${String(message)}`,
    ),
  ),
  transports: [consoleTransport, fileTransport, fileErrorTransport],
});

export default logger;
