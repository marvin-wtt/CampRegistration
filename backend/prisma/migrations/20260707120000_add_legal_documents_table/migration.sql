-- CreateTable
CREATE TABLE `legal_documents` (
    `id` CHAR(26) NOT NULL,
    `type` ENUM('IMPRINT', 'PRIVACY_POLICY') NOT NULL,
    `content` JSON NULL,
    `updated_at` DATETIME(3) NULL,

    UNIQUE INDEX `legal_documents_id_unique`(`id`),
    UNIQUE INDEX `legal_documents_type_unique`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
