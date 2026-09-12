-- AlterTable
ALTER TABLE `message_deliveries` ADD COLUMN `bounce_correlation_id` VARCHAR(191) NULL,
    ADD COLUMN `bounce_reason` TEXT NULL,
    ADD COLUMN `bounced_at` DATETIME(3) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `message_deliveries_bounce_correlation_id_key` ON `message_deliveries`(`bounce_correlation_id`);
