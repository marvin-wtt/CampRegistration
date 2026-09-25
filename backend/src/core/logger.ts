import winston from 'winston';
import 'winston-daily-rotate-file';
import config from '#config/index';
import { appPath } from '#utils/paths';
import { ErrorTrackingTransport } from '#core/errorTracking/errorTracking.transport';
import { getJobContext, type JobContext } from '#core/context/jobContext';

const enumerateErrorFormat = winston.format((info) => {
  if (info instanceof Error) {
    Object.assign(info, { message: info.stack });
  }
  return info;
});

// Formats run synchronously inside `logger.log()`, so the caller's job
// context is still active here — transports may run later and must read `info.job`.
export const jobContextFormat = winston.format((info) => {
  const job = getJobContext();
  if (job) {
    info.job = job;
  }
  return info;
});

export function formatJobTag(job: JobContext): string {
  if (job.source === 'scheduler') {
    return `[cron ${job.name}]`;
  }

  const id = job.id ? `#${job.id}` : '';
  const attempt = job.attempt ? ` attempt ${job.attempt.toString()}` : '';
  return `[job ${job.queue ?? '?'}/${job.name}${id}${attempt}]`;
}

const isDevEnv = config.env === 'development';

const devFormat = winston.format.combine(
  jobContextFormat(),
  enumerateErrorFormat(),
  winston.format.colorize(),
  winston.format.splat(),
  winston.format.timestamp(),
  winston.format.printf(({ level, message, timestamp, job }) => {
    const tag = job ? `${formatJobTag(job as JobContext)} ` : '';
    return `${String(timestamp)} ${level}: ${tag}${String(message)}`;
  }),
);

const prodFormat = winston.format.combine(
  jobContextFormat(),
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
