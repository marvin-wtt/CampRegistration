-- CreateTable
CREATE TABLE `tasks` (
    `id` CHAR(26) NOT NULL,
    `camp_id` CHAR(26) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `notes` TEXT NULL,
    `due_date` VARCHAR(191) NULL,
    `completed` BOOLEAN NOT NULL DEFAULT false,
    `assignee_id` CHAR(26) NULL,

    UNIQUE INDEX `tasks_id_unique`(`id`),
    INDEX `tasks_camp_id_foreign`(`camp_id`),
    INDEX `tasks_assignee_id_foreign`(`assignee_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_camp_id_foreign` FOREIGN KEY (`camp_id`) REFERENCES `camps`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_assignee_id_foreign` FOREIGN KEY (`assignee_id`) REFERENCES `camp_managers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
