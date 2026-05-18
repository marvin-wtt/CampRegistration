-- CreateEnum
CREATE TABLE IF NOT EXISTS `_prisma_enum_RegistrationLogAction` (value VARCHAR(191) NOT NULL PRIMARY KEY);
INSERT IGNORE INTO `_prisma_enum_RegistrationLogAction` VALUES ('CREATE'), ('UPDATE'), ('DELETE');

-- CreateTable
CREATE TABLE `registration_logs` (
    `id` CHAR(26) NOT NULL,
    `registration_id` CHAR(26) NOT NULL,
    `camp_id` CHAR(26) NOT NULL,
    `action` ENUM('CREATE', 'UPDATE', 'DELETE') NOT NULL,
    `before` JSON NULL,
    `after` JSON NULL,
    `note` TEXT NULL,
    `user_id` CHAR(26) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `registration_logs_id_key`(`id`),
    INDEX `registration_logs_registration_id_index`(`registration_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `registration_logs` ADD CONSTRAINT `registration_logs_registration_id_fkey` FOREIGN KEY (`registration_id`) REFERENCES `registrations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `registration_logs` ADD CONSTRAINT `registration_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
