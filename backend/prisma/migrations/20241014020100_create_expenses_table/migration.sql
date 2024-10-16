-- CreateTable
CREATE TABLE `expenses` (
    `id` CHAR(26) NOT NULL,
    `receipt_number` SMALLINT UNSIGNED NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `category` VARCHAR(191) NULL,
    `amount` DECIMAL(65, 30) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `paid_at` DATETIME(3) NULL,
    `paid_by` VARCHAR(191) NULL,
    `payee` VARCHAR(191) NULL,
    `camp_id` VARCHAR(191) NOT NULL,
    `file_id` VARCHAR(191) NULL,

    UNIQUE INDEX `expenses_id_unique`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_camp_id_foreign` FOREIGN KEY (`camp_id`) REFERENCES `camps`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_file_id_foreign` FOREIGN KEY (`file_id`) REFERENCES `files`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
