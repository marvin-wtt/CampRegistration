import prisma from '#core/database.js';
import logger from '#core/logger.js';
import moment from 'moment';
import type { AppJob } from '#core/base/AppJob.js';

export class QueueCleanupJob implements AppJob {
  name = 'queue:job-cleanup';
  pattern = '0 0 * * *';

  async run() {
    await this.deleteCompletedJobs();
    await this.deleteFailedJobs();
  }

  private async deleteCompletedJobs() {
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

  private async deleteFailedJobs() {
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
}
