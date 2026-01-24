-- CreateTable
CREATE TABLE `program_events` (
    `id` CHAR(26) NOT NULL,
    `camp_id` CHAR(36) NOT NULL,
    `title` JSON NOT NULL,
    `details` JSON NULL,
    `location` JSON NULL,
    `date` VARCHAR(191) NULL,
    `duration` INTEGER NULL,
    `time` VARCHAR(191) NULL,
    `background_color` VARCHAR(191) NULL,
    `side` VARCHAR(191) NULL,

    UNIQUE INDEX `program_event_id_unique`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `program_events` ADD CONSTRAINT `program_events_camp_id_fkey` FOREIGN KEY (`camp_id`) REFERENCES `camps`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
