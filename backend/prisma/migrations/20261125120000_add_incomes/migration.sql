-- AlterTable
ALTER TABLE `event_finances` ADD COLUMN `income_number_prefix` VARCHAR(8) NOT NULL DEFAULT 'I',
    ADD COLUMN `last_income_number` INTEGER UNSIGNED NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `files` ADD COLUMN `income_id` CHAR(26) NULL;

-- CreateTable
CREATE TABLE `incomes` (
    `id` CHAR(26) NOT NULL,
    `event_id` CHAR(26) NOT NULL,
    `number` INTEGER UNSIGNED NOT NULL,
    `amount` INTEGER UNSIGNED NOT NULL,
    `original_amount` INTEGER UNSIGNED NULL,
    `original_currency` CHAR(3) NULL,
    `received_on` CHAR(10) NULL,
    `description` VARCHAR(255) NOT NULL,
    `payer_name` VARCHAR(255) NULL,
    `category_id` CHAR(26) NULL,
    `created_by_user_id` CHAR(26) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    UNIQUE INDEX `incomes_id_unique`(`id`),
    INDEX `incomes_category_id_index`(`category_id`),
    INDEX `incomes_created_by_user_id_index`(`created_by_user_id`),
    UNIQUE INDEX `incomes_event_id_number_unique`(`event_id`, `number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `files_income_id_index` ON `files`(`income_id`);

-- AddForeignKey
ALTER TABLE `files` ADD CONSTRAINT `files_income_id_fkey` FOREIGN KEY (`income_id`) REFERENCES `incomes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `incomes` ADD CONSTRAINT `incomes_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `incomes` ADD CONSTRAINT `incomes_event_id_finance_foreign` FOREIGN KEY (`event_id`) REFERENCES `event_finances`(`event_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `incomes` ADD CONSTRAINT `incomes_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `finance_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `incomes` ADD CONSTRAINT `incomes_created_by_user_id_foreign` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
