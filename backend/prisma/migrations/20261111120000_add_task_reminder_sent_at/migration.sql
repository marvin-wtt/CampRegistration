-- AlterTable
ALTER TABLE `tasks` ADD COLUMN `reminder_sent_at` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `tasks_due_date_index` ON `tasks`(`due_date`);
