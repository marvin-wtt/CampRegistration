-- Transfer references: an event code plus a number per registration
-- (docs/payments.md). Added nullable, backfilled, then made NOT NULL.
ALTER TABLE `event_finances` ADD COLUMN `last_reference_number` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    ADD COLUMN `reference_code` CHAR(4) NULL;

-- Backfill: existing events get distinct codes by their position, written in
-- the reference alphabet (no 0, O, 1, I). New events get random ones.
UPDATE `event_finances` f
JOIN (
    SELECT `event_id`, ROW_NUMBER() OVER (ORDER BY `event_id`) - 1 AS n
    FROM `event_finances`
) r ON r.`event_id` = f.`event_id`
SET f.`reference_code` = CONCAT(
    SUBSTRING('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', FLOOR(r.n / 32768) % 32 + 1, 1),
    SUBSTRING('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', FLOOR(r.n / 1024) % 32 + 1, 1),
    SUBSTRING('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', FLOOR(r.n / 32) % 32 + 1, 1),
    SUBSTRING('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', r.n % 32 + 1, 1)
);

ALTER TABLE `event_finances` MODIFY `reference_code` CHAR(4) NOT NULL;

-- AlterTable
ALTER TABLE `registrations` ADD COLUMN `amount_due_adjusted_at` DATETIME(3) NULL,
    ADD COLUMN `amount_due_note` VARCHAR(255) NULL,
    ADD COLUMN `amount_due_override` INTEGER UNSIGNED NULL,
    ADD COLUMN `payment_reference` VARCHAR(16) NULL;

-- Backfill: existing registrations are numbered per event in the order they
-- came in, and each event's counter continues after them.
UPDATE `registrations` reg
JOIN (
    SELECT `id`, `event_id`, ROW_NUMBER() OVER (PARTITION BY `event_id` ORDER BY `created_at`, `id`) AS n
    FROM `registrations`
) r ON r.`id` = reg.`id`
JOIN `event_finances` f ON f.`event_id` = r.`event_id`
SET reg.`payment_reference` = CONCAT(f.`reference_code`, '-', LPAD(r.n, 4, '0'));

UPDATE `event_finances` f
JOIN (
    SELECT `event_id`, COUNT(*) AS last_number
    FROM `registrations`
    GROUP BY `event_id`
) r ON r.`event_id` = f.`event_id`
SET f.`last_reference_number` = r.last_number;

ALTER TABLE `registrations` MODIFY `payment_reference` VARCHAR(16) NOT NULL;

-- CreateTable
CREATE TABLE `payments` (
    `id` CHAR(26) NOT NULL,
    `event_id` CHAR(26) NOT NULL,
    `registration_id` CHAR(26) NULL,
    `source` ENUM('MANUAL') NOT NULL DEFAULT 'MANUAL',
    `status` ENUM('PAID') NOT NULL DEFAULT 'PAID',
    `amount` INTEGER UNSIGNED NOT NULL,
    `currency` CHAR(3) NOT NULL,
    `method` ENUM('BANK_TRANSFER', 'CASH', 'OTHER') NOT NULL,
    `paid_on` CHAR(10) NOT NULL,
    `note` VARCHAR(255) NULL,
    `payer_name` VARCHAR(255) NULL,
    `registration_ref` CHAR(26) NOT NULL,
    `settlement` ENUM('RETAINED', 'SETTLED_OUTSIDE') NULL,
    `created_by_user_id` CHAR(26) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    UNIQUE INDEX `payments_id_unique`(`id`),
    INDEX `payments_event_id_index`(`event_id`),
    INDEX `payments_registration_id_index`(`registration_id`),
    INDEX `payments_registration_ref_index`(`registration_ref`),
    INDEX `payments_created_by_user_id_index`(`created_by_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_refunds` (
    `id` CHAR(26) NOT NULL,
    `payment_id` CHAR(26) NOT NULL,
    `status` ENUM('REFUNDED') NOT NULL DEFAULT 'REFUNDED',
    `amount` INTEGER UNSIGNED NOT NULL,
    `refunded_on` CHAR(10) NOT NULL,
    `reason` VARCHAR(255) NULL,
    `amount_due_reduction` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `created_by_user_id` CHAR(26) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    UNIQUE INDEX `payment_refunds_id_unique`(`id`),
    INDEX `payment_refunds_payment_id_index`(`payment_id`),
    INDEX `payment_refunds_created_by_user_id_index`(`created_by_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `event_finances_reference_code_unique` ON `event_finances`(`reference_code`);

-- CreateIndex
CREATE UNIQUE INDEX `registrations_payment_reference_unique` ON `registrations`(`payment_reference`);

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_registration_id_foreign` FOREIGN KEY (`registration_id`) REFERENCES `registrations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_created_by_user_id_foreign` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_refunds` ADD CONSTRAINT `payment_refunds_payment_id_foreign` FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_refunds` ADD CONSTRAINT `payment_refunds_created_by_user_id_foreign` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
