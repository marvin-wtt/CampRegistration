import prisma from '#core/database.js';
import logger from '#core/logger.js';
import moment from 'moment';

export async function deleteOldQueueJobs() {
  await deleteCompletedJobs();
  await deleteFailedJobs();
}

async function deleteCompletedJobs() {
  const { count } = await prisma.job.deleteMany({
    where: {
      status: 'COMPLETED',
      finishedAt: {
        lt: moment().subtract('30', 'days').toDate(),
      },
    },
  });

  logger.info(`Deleted ${count.toString()} completed jobs`);
}

async function deleteFailedJobs() {
  const { count } = await prisma.job.deleteMany({
    where: {
      status: 'FAILED',
      finishedAt: {
        lt: moment().subtract('90', 'days').toDate(),
      },
    },
  });

  logger.info(`Deleted ${count.toString()} failed jobs`);
}
