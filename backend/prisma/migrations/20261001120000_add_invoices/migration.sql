-- AlterTable
ALTER TABLE `files` ADD COLUMN `invoice_id` CHAR(26) NULL;

-- CreateTable
CREATE TABLE `invoices` (
    `id` CHAR(26) NOT NULL,
    `event_bill_id` CHAR(26) NOT NULL,
    `source` ENUM('UPLOADED', 'GENERATED') NOT NULL,
    `type` ENUM('INVOICE', 'CANCELLATION') NOT NULL DEFAULT 'INVOICE',
    `number` VARCHAR(64) NULL,
    `cancels_invoice_id` CHAR(26) NULL,
    `issued_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `invoices_id_unique`(`id`),
    UNIQUE INDEX `invoices_number_unique`(`number`),
    UNIQUE INDEX `invoices_cancels_invoice_id_unique`(`cancels_invoice_id`),
    UNIQUE INDEX `invoices_event_bill_id_type_unique`(`event_bill_id`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `files` ADD CONSTRAINT `files_invoice_id_fkey` FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_event_bill_id_foreign` FOREIGN KEY (`event_bill_id`) REFERENCES `event_bills`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_cancels_invoice_id_foreign` FOREIGN KEY (`cancels_invoice_id`) REFERENCES `invoices`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
