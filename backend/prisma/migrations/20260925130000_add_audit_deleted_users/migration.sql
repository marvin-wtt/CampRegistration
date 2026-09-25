-- CreateTable
CREATE TABLE `audit_deleted_users` (
    `id` CHAR(26) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `deleted_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_deleted_users_deleted_at_index`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
