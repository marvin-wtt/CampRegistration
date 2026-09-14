-- CreateTable
CREATE TABLE `program_published_days` (
    `id` CHAR(26) NOT NULL,
    `event_id` CHAR(26) NOT NULL,
    `date` CHAR(10) NOT NULL,
    `plan` VARCHAR(191) NOT NULL DEFAULT 'both',

    UNIQUE INDEX `program_published_days_id_unique`(`id`),
    UNIQUE INDEX `program_published_days_event_id_date_unique`(`event_id`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `program_published_days` ADD CONSTRAINT `program_published_days_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;