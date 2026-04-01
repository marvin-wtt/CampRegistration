-- CreateTable
CREATE TABLE `newsletters` (
    `id` CHAR(26) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    UNIQUE INDEX `newsletters_id_unique`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `newsletter_managers` (
    `id` CHAR(26) NOT NULL,
    `newsletter_id` CHAR(26) NOT NULL,
    `user_id` CHAR(26) NOT NULL,

    UNIQUE INDEX `newsletter_managers_id_unique`(`id`),
    INDEX `newsletter_managers_newsletter_id_index`(`newsletter_id`),
    INDEX `newsletter_managers_user_id_index`(`user_id`),
    UNIQUE INDEX `newsletter_managers_newsletter_id_user_id_unique`(`newsletter_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `newsletter_subscribers` (
    `id` CHAR(26) NOT NULL,
    `newsletter_id` CHAR(26) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NULL,
    `country` VARCHAR(5) NULL,
    `unsubscribe_token` CHAR(64) NOT NULL,
    `subscribed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `newsletter_subscribers_id_unique`(`id`),
    UNIQUE INDEX `newsletter_subscribers_unsubscribe_token_unique`(`unsubscribe_token`),
    INDEX `newsletter_subscribers_newsletter_id_index`(`newsletter_id`),
    UNIQUE INDEX `newsletter_subscribers_newsletter_id_email_unique`(`newsletter_id`, `email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `newsletter_messages` (
    `id` CHAR(26) NOT NULL,
    `newsletter_id` CHAR(26) NOT NULL,
    `subject` VARCHAR(255) NOT NULL,
    `body` TEXT NOT NULL,
    `recipient_count` INTEGER NOT NULL,
    `sent_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `newsletter_messages_id_unique`(`id`),
    INDEX `newsletter_messages_newsletter_id_index`(`newsletter_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `newsletter_managers` ADD CONSTRAINT `newsletter_managers_newsletter_id_foreign` FOREIGN KEY (`newsletter_id`) REFERENCES `newsletters`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `newsletter_managers` ADD CONSTRAINT `newsletter_managers_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `newsletter_subscribers` ADD CONSTRAINT `newsletter_subscribers_newsletter_id_foreign` FOREIGN KEY (`newsletter_id`) REFERENCES `newsletters`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `newsletter_messages` ADD CONSTRAINT `newsletter_messages_newsletter_id_foreign` FOREIGN KEY (`newsletter_id`) REFERENCES `newsletters`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
