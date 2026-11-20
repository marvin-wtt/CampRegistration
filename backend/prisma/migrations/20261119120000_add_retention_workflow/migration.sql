-- The retention workflow (docs/privacy.md, 8): one deadline row per kind of
-- data replaces the single reminder flag, and the event records for good when
-- its data was deleted.
-- AlterTable
ALTER TABLE `events` DROP COLUMN `retention_reminder_sent_at`,
    ADD COLUMN `registration_data_purged_at` DATETIME(0) NULL,
    ADD COLUMN `sensitive_data_purged_at` DATETIME(0) NULL;

-- CreateTable
CREATE TABLE `event_retention_deadlines` (
    `id` CHAR(26) NOT NULL,
    `event_id` CHAR(26) NOT NULL,
    `kind` ENUM('sensitive', 'registrations') NOT NULL,
    `due_at` DATETIME(0) NOT NULL,
    `postponed_until` DATETIME(0) NULL,
    `postpone_reason` TEXT NULL,
    `postponed_at` DATETIME(0) NULL,
    `postponed_by_id` CHAR(26) NULL,
    `notified_stage` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `event_retention_deadlines_event_id_kind_key`(`event_id`, `kind`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `event_retention_deadlines` ADD CONSTRAINT `event_retention_deadlines_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_retention_deadlines` ADD CONSTRAINT `event_retention_deadlines_postponed_by_id_fkey` FOREIGN KEY (`postponed_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
