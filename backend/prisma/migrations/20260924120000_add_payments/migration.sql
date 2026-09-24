-- AlterTable
ALTER TABLE `events` ADD COLUMN `currency` CHAR(3) NOT NULL DEFAULT 'EUR';

-- AlterTable
ALTER TABLE `registrations` ADD COLUMN `amount_due` INTEGER UNSIGNED NULL,
    ADD COLUMN `payment_reminder_sent_at` DATETIME(3) NULL,
    ADD COLUMN `payment_requested_at` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `payment_accounts` (
    `id` CHAR(26) NOT NULL,
    `organization_id` CHAR(26) NOT NULL,
    `provider` VARCHAR(32) NOT NULL,
    `mode` VARCHAR(8) NOT NULL,
    `display_name` VARCHAR(255) NULL,
    `credentials` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    UNIQUE INDEX `payment_accounts_id_unique`(`id`),
    UNIQUE INDEX `payment_accounts_organization_id_unique`(`organization_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` CHAR(26) NOT NULL,
    `registration_id` CHAR(26) NULL,
    `event_id` CHAR(26) NOT NULL,
    `source` VARCHAR(32) NOT NULL,
    `provider_payment_id` VARCHAR(255) NULL,
    `status` ENUM('OPEN', 'PENDING', 'PAID', 'FAILED', 'CANCELED', 'EXPIRED') NOT NULL,
    `amount` INTEGER UNSIGNED NOT NULL,
    `currency` CHAR(3) NOT NULL,
    `method` VARCHAR(64) NULL,
    `checkout_url` TEXT NULL,
    `expires_at` DATETIME(3) NULL,
    `paid_at` DATETIME(3) NULL,
    `note` TEXT NULL,
    `created_by_id` CHAR(26) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    UNIQUE INDEX `payments_id_unique`(`id`),
    INDEX `payments_registration_id_index`(`registration_id`),
    INDEX `payments_event_id_index`(`event_id`),
    INDEX `payments_created_by_id_index`(`created_by_id`),
    UNIQUE INDEX `payments_source_provider_payment_id_unique`(`source`, `provider_payment_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_refunds` (
    `id` CHAR(26) NOT NULL,
    `payment_id` CHAR(26) NOT NULL,
    `provider_refund_id` VARCHAR(255) NULL,
    `status` ENUM('PENDING', 'REFUNDED', 'FAILED', 'CANCELED') NOT NULL,
    `amount` INTEGER UNSIGNED NOT NULL,
    `reason` TEXT NULL,
    `notify_participant` BOOLEAN NOT NULL DEFAULT true,
    `created_by_id` CHAR(26) NULL,
    `refunded_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    UNIQUE INDEX `payment_refunds_id_unique`(`id`),
    INDEX `payment_refunds_created_by_id_index`(`created_by_id`),
    UNIQUE INDEX `payment_refunds_payment_id_provider_refund_id_unique`(`payment_id`, `provider_refund_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `payment_accounts` ADD CONSTRAINT `payment_accounts_organization_id_foreign` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_registration_id_foreign` FOREIGN KEY (`registration_id`) REFERENCES `registrations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_created_by_id_foreign` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_refunds` ADD CONSTRAINT `payment_refunds_payment_id_foreign` FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_refunds` ADD CONSTRAINT `payment_refunds_created_by_id_foreign` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

