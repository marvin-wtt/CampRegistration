-- CreateTable
CREATE TABLE `price_models` (
    `id` CHAR(26) NOT NULL,
    `name` JSON NOT NULL,
    `currency` CHAR(3) NOT NULL DEFAULT 'EUR',
    `price_per_registration` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `base_fee` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `tax_rate` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `is_default` BOOLEAN NULL,
    `archived_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    UNIQUE INDEX `price_models_id_unique`(`id`),
    UNIQUE INDEX `price_models_is_default_unique`(`is_default`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- The seeded free model. Every existing organization starts on it, and it is the
-- default for new organizations until an administrator marks another one.
-- The id is fixed so code and fixtures can refer to it (FREE_PRICE_MODEL_ID).
INSERT INTO `price_models` (`id`, `name`, `currency`, `price_per_registration`, `base_fee`, `tax_rate`, `is_default`)
VALUES ('01K6B00000000000000000FREE', '{"en":"Free","de":"Kostenlos","fr":"Gratuit","pl":"Bezpłatny","cs":"Zdarma"}', 'EUR', 0, 0, 0, true);

-- AlterTable: backfill before NOT NULL
ALTER TABLE `organizations` ADD COLUMN `price_model_id` CHAR(26) NULL;
UPDATE `organizations` SET `price_model_id` = '01K6B00000000000000000FREE';
ALTER TABLE `organizations` MODIFY `price_model_id` CHAR(26) NOT NULL;

-- AlterTable: every event is pinned to the model its organization was on when
-- it was created, so a later change of the organization's model leaves the
-- event's price alone. Existing events take their organization's model.
ALTER TABLE `events` ADD COLUMN `price_model_id` CHAR(26) NULL;
UPDATE `events` e
    JOIN `organizations` o ON o.`id` = e.`organization_id`
    SET e.`price_model_id` = o.`price_model_id`;
ALTER TABLE `events` MODIFY `price_model_id` CHAR(26) NOT NULL;

-- CreateTable
CREATE TABLE `event_bills` (
    `id` CHAR(26) NOT NULL,
    `event_id` CHAR(26) NULL,
    `replaces_bill_id` CHAR(26) NULL,
    `sequence` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    `organization_id` CHAR(26) NULL,
    `price_model_id` CHAR(26) NULL,
    `status` ENUM('DRAFT', 'OPEN', 'PAID', 'VOID') NOT NULL DEFAULT 'DRAFT',
    `start_registration_count` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `end_registration_count` INTEGER UNSIGNED NULL,
    `adjusted_registration_count` INTEGER UNSIGNED NULL,
    `event_name` JSON NOT NULL,
    `event_start_at` DATETIME(0) NOT NULL,
    `event_end_at` DATETIME(0) NOT NULL,
    `event_timezone` VARCHAR(64) NOT NULL,
    `customer_name` VARCHAR(255) NULL,
    `customer_address_street` VARCHAR(255) NULL,
    `customer_address_zip_code` VARCHAR(20) NULL,
    `customer_address_city` VARCHAR(255) NULL,
    `customer_country` CHAR(2) NULL,
    `customer_vat_number` VARCHAR(32) NULL,
    `currency` CHAR(3) NULL,
    `price_per_registration` DECIMAL(10, 2) NULL,
    `base_fee` DECIMAL(10, 2) NULL,
    `tax_rate` DECIMAL(5, 2) NULL,
    `net_amount` DECIMAL(12, 2) NULL,
    `tax_amount` DECIMAL(12, 2) NULL,
    `gross_amount` DECIMAL(12, 2) NULL,
    `finalized_at` DATETIME(3) NULL,
    `paid_at` DATETIME(3) NULL,
    `voided_at` DATETIME(3) NULL,
    `note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    UNIQUE INDEX `event_bills_id_unique`(`id`),
    UNIQUE INDEX `event_bills_replaces_bill_id_unique`(`replaces_bill_id`),
    INDEX `event_bills_organization_id_status_index`(`organization_id`, `status`),
    INDEX `event_bills_status_index`(`status`),
    INDEX `event_bills_price_model_id_index`(`price_model_id`),
    UNIQUE INDEX `event_bills_event_id_sequence_unique`(`event_id`, `sequence`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `events_price_model_id_index` ON `events`(`price_model_id`);

-- CreateIndex
CREATE INDEX `organizations_price_model_id_index` ON `organizations`(`price_model_id`);

-- AddForeignKey
ALTER TABLE `organizations` ADD CONSTRAINT `organizations_price_model_id_foreign` FOREIGN KEY (`price_model_id`) REFERENCES `price_models`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `events` ADD CONSTRAINT `events_price_model_id_foreign` FOREIGN KEY (`price_model_id`) REFERENCES `price_models`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_bills` ADD CONSTRAINT `event_bills_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_bills` ADD CONSTRAINT `event_bills_organization_id_foreign` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_bills` ADD CONSTRAINT `event_bills_price_model_id_foreign` FOREIGN KEY (`price_model_id`) REFERENCES `price_models`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_bills` ADD CONSTRAINT `event_bills_replaces_bill_id_foreign` FOREIGN KEY (`replaces_bill_id`) REFERENCES `event_bills`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Price changes need the organization's acceptance; accepted offers are the proof.
-- CreateTable
CREATE TABLE `price_model_offers` (
    `id` CHAR(26) NOT NULL,
    `organization_id` CHAR(26) NOT NULL,
    `price_model_id` CHAR(26) NOT NULL,
    `effective_at` DATETIME(3) NOT NULL,
    `created_by_user_id` CHAR(26) NULL,
    `accepted_by_user_id` CHAR(26) NULL,
    `accepted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `price_model_offers_id_unique`(`id`),
    INDEX `price_model_offers_organization_id_accepted_at_index`(`organization_id`, `accepted_at`),
    INDEX `price_model_offers_price_model_id_index`(`price_model_id`),
    INDEX `price_model_offers_created_by_user_id_index`(`created_by_user_id`),
    INDEX `price_model_offers_accepted_by_user_id_index`(`accepted_by_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `price_model_offers` ADD CONSTRAINT `price_model_offers_organization_id_foreign` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `price_model_offers` ADD CONSTRAINT `price_model_offers_price_model_id_foreign` FOREIGN KEY (`price_model_id`) REFERENCES `price_models`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `price_model_offers` ADD CONSTRAINT `price_model_offers_created_by_user_id_foreign` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `price_model_offers` ADD CONSTRAINT `price_model_offers_accepted_by_user_id_foreign` FOREIGN KEY (`accepted_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

