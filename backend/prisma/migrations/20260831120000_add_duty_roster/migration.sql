-- CreateTable
CREATE TABLE `duties` (
    `id` CHAR(26) NOT NULL,
    `event_id` CHAR(26) NOT NULL,
    `name` JSON NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 999,
    `rotation_unit` ENUM('PARTICIPANT', 'ROOM') NOT NULL DEFAULT 'PARTICIPANT',
    `default_count` INTEGER UNSIGNED NULL,

    UNIQUE INDEX `duties_id_unique`(`id`),
    INDEX `duties_event_id_foreign`(`event_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `duty_assignments` (
    `id` CHAR(26) NOT NULL,
    `event_id` CHAR(26) NOT NULL,
    `duty_id` CHAR(26) NOT NULL,
    `date` VARCHAR(10) NOT NULL,
    `slot` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `duty_assignments_id_unique`(`id`),
    INDEX `duty_assignments_event_id_foreign`(`event_id`),
    INDEX `duty_assignments_duty_id_foreign`(`duty_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `duty_assignment_members` (
    `id` CHAR(26) NOT NULL,
    `duty_assignment_id` CHAR(26) NOT NULL,
    `registration_id` CHAR(26) NOT NULL,

    UNIQUE INDEX `duty_assignment_members_id_unique`(`id`),
    UNIQUE INDEX `duty_assignment_members_unique`(`duty_assignment_id`, `registration_id`),
    INDEX `duty_assignment_members_registration_id_foreign`(`registration_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `duties` ADD CONSTRAINT `duties_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `duty_assignments` ADD CONSTRAINT `duty_assignments_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `duty_assignments` ADD CONSTRAINT `duty_assignments_duty_id_foreign` FOREIGN KEY (`duty_id`) REFERENCES `duties`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `duty_assignment_members` ADD CONSTRAINT `duty_assignment_members_duty_assignment_id_foreign` FOREIGN KEY (`duty_assignment_id`) REFERENCES `duty_assignments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `duty_assignment_members` ADD CONSTRAINT `duty_assignment_members_registration_id_foreign` FOREIGN KEY (`registration_id`) REFERENCES `registrations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;