-- CreateTable
CREATE TABLE `chores` (
    `id` CHAR(26) NOT NULL,
    `event_id` CHAR(26) NOT NULL,
    `name` JSON NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 999,
    `default_count` INTEGER UNSIGNED NULL,
    `exclude_staff` BOOLEAN NOT NULL DEFAULT false,
    `balance_countries` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `chores_id_unique`(`id`),
    INDEX `chores_event_id_foreign`(`event_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chore_assignments` (
    `id` CHAR(26) NOT NULL,
    `event_id` CHAR(26) NOT NULL,
    `chore_id` CHAR(26) NOT NULL,
    `rotation_unit` ENUM('PARTICIPANT', 'ROOM') NOT NULL,
    `date` DATE NOT NULL,
    `slot` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `chore_assignments_id_unique`(`id`),
    INDEX `chore_assignments_event_id_foreign`(`event_id`),
    INDEX `chore_assignments_chore_id_foreign`(`chore_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chore_assignment_members` (
    `id` CHAR(26) NOT NULL,
    `chore_assignment_id` CHAR(26) NOT NULL,
    `registration_id` CHAR(26) NOT NULL,

    UNIQUE INDEX `chore_assignment_members_id_unique`(`id`),
    UNIQUE INDEX `chore_assignment_members_unique`(`chore_assignment_id`, `registration_id`),
    INDEX `chore_assignment_members_registration_id_foreign`(`registration_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `chores` ADD CONSTRAINT `chores_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chore_assignments` ADD CONSTRAINT `chore_assignments_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chore_assignments` ADD CONSTRAINT `chore_assignments_chore_id_foreign` FOREIGN KEY (`chore_id`) REFERENCES `chores`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chore_assignment_members` ADD CONSTRAINT `chore_assignment_members_chore_assignment_id_foreign` FOREIGN KEY (`chore_assignment_id`) REFERENCES `chore_assignments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chore_assignment_members` ADD CONSTRAINT `chore_assignment_members_registration_id_foreign` FOREIGN KEY (`registration_id`) REFERENCES `registrations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;