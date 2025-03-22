-- AlterTable
ALTER TABLE `files` ADD COLUMN `message_id` CHAR(36) NULL;

-- CreateTable
CREATE TABLE `messages` (
    `id` CHAR(26) NOT NULL,
    `message_template_id` CHAR(36) NULL,
    `registration_id` CHAR(36) NULL,
    `reply_to` VARCHAR(191) NULL,
    `subject` MEDIUMTEXT NOT NULL,
    `body` MEDIUMTEXT NOT NULL,
    `priority` VARCHAR(191) NOT NULL DEFAULT 'normal',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `message_id_unique`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `message_recipients` (
    `id` CHAR(26) NOT NULL,
    `message_id` CHAR(36) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `sent_at` DATETIME(3) NULL,
    `bounced_at` DATETIME(3) NULL,
    `delivered_at` DATETIME(3) NULL,

    UNIQUE INDEX `message_id_unique`(`id`),
    UNIQUE INDEX `message_recipients_message_id_key`(`message_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `message_templates` (
    `id` CHAR(26) NOT NULL,
    `camp_id` CHAR(36) NOT NULL,
    `event` VARCHAR(191) NULL,
    `priority` VARCHAR(191) NOT NULL DEFAULT 'normal',
    `reply_to` VARCHAR(191) NULL,
    `subject` JSON NOT NULL,
    `body` JSON NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `message_template_id_unique`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `files` ADD CONSTRAINT `files_message_id_fkey` FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_message_template_id_fkey` FOREIGN KEY (`message_template_id`) REFERENCES `message_templates`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_registration_id_fkey` FOREIGN KEY (`registration_id`) REFERENCES `registrations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `message_recipients` ADD CONSTRAINT `message_recipients_message_id_fkey` FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `message_templates` ADD CONSTRAINT `message_templates_camp_id_fkey` FOREIGN KEY (`camp_id`) REFERENCES `camps`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
