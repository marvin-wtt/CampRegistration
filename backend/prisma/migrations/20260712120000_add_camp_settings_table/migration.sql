-- CreateTable
CREATE TABLE `camp_settings` (
    `id` CHAR(26) NOT NULL,
    `camp_id` CHAR(26) NOT NULL,
    `key` VARCHAR(100) NOT NULL,
    `data` JSON NOT NULL,
    `updated_at` DATETIME(3) NULL,

    UNIQUE INDEX `camp_settings_id_unique`(`id`),
    UNIQUE INDEX `camp_settings_camp_id_key_unique`(`camp_id`, `key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `camp_settings` ADD CONSTRAINT `camp_settings_camp_id_foreign` FOREIGN KEY (`camp_id`) REFERENCES `camps`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
