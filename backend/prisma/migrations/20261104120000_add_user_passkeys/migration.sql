-- CreateTable
CREATE TABLE `user_passkeys` (
    `id` CHAR(26) NOT NULL,
    `user_id` CHAR(26) NOT NULL,
    `credential_id` VARCHAR(512) NOT NULL,
    `public_key` LONGBLOB NOT NULL,
    `counter` INTEGER NOT NULL DEFAULT 0,
    `transports` JSON NULL,
    `device_type` VARCHAR(32) NOT NULL,
    `backed_up` BOOLEAN NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `last_used_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `user_passkeys_id_unique`(`id`),
    UNIQUE INDEX `user_passkeys_credential_id_unique`(`credential_id`),
    INDEX `user_passkeys_user_id_index`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `passkey_challenges` (
    `id` CHAR(26) NOT NULL,
    `challenge` VARCHAR(255) NOT NULL,
    `type` ENUM('REGISTRATION', 'AUTHENTICATION') NOT NULL,
    `user_id` CHAR(26) NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `passkey_challenges_id_unique`(`id`),
    INDEX `passkey_challenges_user_id_index`(`user_id`),
    INDEX `passkey_challenges_expires_at_index`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_passkeys` ADD CONSTRAINT `user_passkeys_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `passkey_challenges` ADD CONSTRAINT `passkey_challenges_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
