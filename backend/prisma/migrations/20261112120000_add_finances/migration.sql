-- AlterTable
ALTER TABLE `events` ADD COLUMN `last_payout_number` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    ADD COLUMN `last_receipt_number` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    ADD COLUMN `payout_number_prefix` VARCHAR(8) NOT NULL DEFAULT 'P';

-- AlterTable
ALTER TABLE `files` ADD COLUMN `expense_id` CHAR(26) NULL;

-- CreateTable
CREATE TABLE `expense_categories` (
    `id` CHAR(26) NOT NULL,
    `event_id` CHAR(26) NOT NULL,
    `parent_id` CHAR(26) NULL,
    `name` JSON NOT NULL,
    `position` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `archived_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    UNIQUE INDEX `expense_categories_id_unique`(`id`),
    INDEX `expense_categories_event_id_index`(`event_id`),
    INDEX `expense_categories_parent_id_index`(`parent_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `expenses` (
    `id` CHAR(26) NOT NULL,
    `event_id` CHAR(26) NOT NULL,
    `receipt_number` INTEGER UNSIGNED NOT NULL,
    `type` ENUM('EXPENSE', 'REFUND') NOT NULL DEFAULT 'EXPENSE',
    `amount` INTEGER UNSIGNED NOT NULL,
    `original_amount` INTEGER UNSIGNED NULL,
    `original_currency` CHAR(3) NULL,
    `date` CHAR(10) NULL,
    `description` VARCHAR(255) NOT NULL,
    `category_id` CHAR(26) NULL,
    `paid_by_user_id` CHAR(26) NULL,
    `paid_by_name` VARCHAR(255) NULL,
    `created_by_user_id` CHAR(26) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    UNIQUE INDEX `expenses_id_unique`(`id`),
    INDEX `expenses_category_id_index`(`category_id`),
    INDEX `expenses_paid_by_user_id_index`(`paid_by_user_id`),
    INDEX `expenses_created_by_user_id_index`(`created_by_user_id`),
    UNIQUE INDEX `expenses_event_id_receipt_number_unique`(`event_id`, `receipt_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payouts` (
    `id` CHAR(26) NOT NULL,
    `event_id` CHAR(26) NOT NULL,
    `number` INTEGER UNSIGNED NOT NULL,
    `recipient_user_id` CHAR(26) NULL,
    `recipient_name` VARCHAR(255) NOT NULL,
    `direction` ENUM('OUT', 'IN') NOT NULL,
    `amount` INTEGER UNSIGNED NOT NULL,
    `paid_on` CHAR(10) NULL,
    `note` VARCHAR(255) NULL,
      `signature` TEXT NULL,
    `signed_at` DATETIME(3) NULL,
    `created_by_user_id` CHAR(26) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    UNIQUE INDEX `payouts_id_unique`(`id`),
    INDEX `payouts_recipient_user_id_index`(`recipient_user_id`),
    INDEX `payouts_created_by_user_id_index`(`created_by_user_id`),
    UNIQUE INDEX `payouts_event_id_number_unique`(`event_id`, `number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `files_expense_id_index` ON `files`(`expense_id`);

-- AddForeignKey
ALTER TABLE `files` ADD CONSTRAINT `files_expense_id_fkey` FOREIGN KEY (`expense_id`) REFERENCES `expenses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expense_categories` ADD CONSTRAINT `expense_categories_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expense_categories` ADD CONSTRAINT `expense_categories_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `expense_categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `expense_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_paid_by_user_id_foreign` FOREIGN KEY (`paid_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_created_by_user_id_foreign` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payouts` ADD CONSTRAINT `payouts_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payouts` ADD CONSTRAINT `payouts_recipient_user_id_foreign` FOREIGN KEY (`recipient_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payouts` ADD CONSTRAINT `payouts_created_by_user_id_foreign` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

