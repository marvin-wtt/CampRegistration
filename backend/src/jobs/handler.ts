import Chron from 'croner';
import logger from '../config/logger';
import Cron from 'croner';
import moment from 'moment';

export const errorHandler = (error: unknown, job: Chron) => {
  logger.error(`Job ${job.name} failed. ${error}`);
};

export const protectionHandler = (job: Chron) => {
  const startTime = job.currentRun()?.toISOString();
  logger.warning(`Job ${job.name} was blocked by call started at ${startTime}`);
};

export const terminationHandler = (reason: string, job: Chron) => {
  logger.info(`Job ${job.name} terminated. No future executions scheduled.`);
};

export const executionHandler = (job: Chron) => {
  logger.info(`Job ${job.name} executing...`);
};

export const completionHandler = (job: Cron) => {
  const duration = moment.duration(moment().diff(job.currentRun())).humanize();
  logger.info(`Job ${job.name} completed after ${duration}`);
};
