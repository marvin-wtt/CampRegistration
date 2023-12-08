-- CreateTable
CREATE TABLE `users` (
    `id` CHAR(26) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `email_verified` BOOLEAN NOT NULL DEFAULT false,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
    `locale` VARCHAR(5) NOT NULL DEFAULT 'en-US',
    `locked` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    UNIQUE INDEX `users_id_unique`(`id`),
    UNIQUE INDEX `users_email_unique`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `camps` (
    `id` CHAR(26) NOT NULL,
    `active` BOOLEAN NOT NULL,
    `public` BOOLEAN NOT NULL,
    `countries` JSON NOT NULL,
    `name` JSON NOT NULL,
    `organizer` JSON NOT NULL,
    `contact_email` JSON NOT NULL,
    `max_participants` JSON NOT NULL,
    `min_age` INTEGER UNSIGNED NOT NULL,
    `max_age` INTEGER UNSIGNED NOT NULL,
    `start_at` DATETIME(0) NOT NULL,
    `end_at` DATETIME(0) NOT NULL,
    `price` DOUBLE NOT NULL,
    `location` JSON NULL,
    `form` JSON NOT NULL,
    `themes` JSON NOT NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    UNIQUE INDEX `camps_id_unique`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `camp_managers` (
    `id` CHAR(26) NOT NULL,
    `camp_id` CHAR(26) NOT NULL,
    `user_id` CHAR(26) NULL,
    `invitation_id` CHAR(26) NULL,

    UNIQUE INDEX `camp_managers_id_unique`(`id`),
    INDEX `camp_managers_camp_id_foreign`(`camp_id`),
    INDEX `camp_managers_user_id_foreign`(`user_id`),
    INDEX `camp_manager_invitation_id_foreign`(`invitation_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `camp_manager_invitations` (
    `id` CHAR(26) NOT NULL,
    `email` VARCHAR(255) NOT NULL,

    UNIQUE INDEX `invitations_id_unique`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `registrations` (
    `id` CHAR(26) NOT NULL,
    `camp_id` CHAR(26) NULL,
    `data` JSON NOT NULL,
    `camp_data` JSON NOT NULL,
    `locale` VARCHAR(5) NOT NULL DEFAULT 'en-US',
    `waiting_list` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    UNIQUE INDEX `registrations_id_unique`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rooms` (
    `id` CHAR(26) NOT NULL,
    `camp_id` CHAR(26) NOT NULL,
    `name` JSON NOT NULL,
    `capacity` INTEGER UNSIGNED NOT NULL,

    UNIQUE INDEX `rooms_id_unique`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `beds` (
    `id` CHAR(26) NOT NULL,
    `room_id` CHAR(26) NOT NULL,
    `registration_id` CHAR(26) NULL,

    UNIQUE INDEX `beds_id_key`(`id`),
    UNIQUE INDEX `beds_registration_id_unique`(`registration_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `templates` (
    `id` CHAR(26) NOT NULL,
    `camp_id` CHAR(26) NOT NULL,
    `data` JSON NOT NULL,

    UNIQUE INDEX `templates_id_unique`(`id`),
    INDEX `templates_camp_id_foreign`(`camp_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tokens` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` CHAR(26) NOT NULL,
    `token` CHAR(255) NOT NULL,
    `type` ENUM('ACCESS', 'REFRESH', 'RESET_PASSWORD', 'VERIFY_EMAIL') NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `blacklisted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `files` (
    `id` CHAR(26) NOT NULL,
    `camp_id` CHAR(36) NULL,
    `registration_id` CHAR(36) NULL,
    `name` VARCHAR(191) NOT NULL,
    `original_name` VARCHAR(191) NOT NULL,
    `field` VARCHAR(191) NULL,
    `type` VARCHAR(191) NOT NULL,
    `size` INTEGER NOT NULL,
    `access_level` VARCHAR(191) NULL,
    `storage_location` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `files_id_unique`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `camp_managers` ADD CONSTRAINT `camp_managers_camp_id_foreign` FOREIGN KEY (`camp_id`) REFERENCES `camps`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `camp_managers` ADD CONSTRAINT `camp_managers_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `camp_managers` ADD CONSTRAINT `camp_managers_invitation_id_foreign` FOREIGN KEY (`invitation_id`) REFERENCES `camp_manager_invitations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `registrations` ADD CONSTRAINT `registrations_camp_id_foreign` FOREIGN KEY (`camp_id`) REFERENCES `camps`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rooms` ADD CONSTRAINT `rooms_camp_id_foreign` FOREIGN KEY (`camp_id`) REFERENCES `camps`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `beds` ADD CONSTRAINT `beds_room_id_foreign` FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `beds` ADD CONSTRAINT `beds_registration_id_foreign` FOREIGN KEY (`registration_id`) REFERENCES `registrations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `templates` ADD CONSTRAINT `templates_camp_id_foreign` FOREIGN KEY (`camp_id`) REFERENCES `camps`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tokens` ADD CONSTRAINT `tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `files` ADD CONSTRAINT `files_camp_id_fkey` FOREIGN KEY (`camp_id`) REFERENCES `camps`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `files` ADD CONSTRAINT `files_registration_id_fkey` FOREIGN KEY (`registration_id`) REFERENCES `registrations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
