-- CreateTable
CREATE TABLE `admin_access_grants` (
    `id` CHAR(26) NOT NULL,
    `user_id` CHAR(26) NOT NULL,
    `scope` ENUM('event', 'newsletter', 'organization') NOT NULL,
    `scope_id` CHAR(26) NOT NULL,
    `reason` VARCHAR(500) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `ended_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `admin_access_grants_id_unique`(`id`),
    INDEX `admin_access_grants_lookup_index`(`user_id`, `scope`, `scope_id`, `expires_at`),
    INDEX `admin_access_grants_scope_index`(`scope`, `scope_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `admin_access_grants` ADD CONSTRAINT `admin_access_grants_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
