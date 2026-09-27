-- AlterTable
ALTER TABLE `chores` ADD COLUMN `default_rotation_unit` ENUM('PERSON', 'ROOM') NOT NULL DEFAULT 'PERSON',
    ADD COLUMN `effort` ENUM('LIGHT', 'NORMAL', 'HEAVY') NOT NULL DEFAULT 'NORMAL',
    ADD COLUMN `eligibility` ENUM('PARTICIPANTS', 'STAFF', 'EVERYONE') NOT NULL DEFAULT 'PARTICIPANTS',
    ADD COLUMN `supervisor_count` INTEGER UNSIGNED NOT NULL DEFAULT 0;

-- Backfill: `exclude_staff` becomes an eligibility
UPDATE `chores` SET `eligibility` = IF(`exclude_staff`, 'PARTICIPANTS', 'EVERYONE');

-- AlterTable
ALTER TABLE `chores` DROP COLUMN `exclude_staff`;

-- AlterTable
ALTER TABLE `chore_assignment_members` ADD COLUMN `missed` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `role` ENUM('MEMBER', 'SUPERVISOR') NOT NULL DEFAULT 'MEMBER';

-- AlterTable
ALTER TABLE `chore_assignments` ADD COLUMN `batch_id` CHAR(26) NULL,
    ADD COLUMN `note` VARCHAR(500) NULL,
    ADD COLUMN `slot_id` CHAR(26) NULL,
    ADD COLUMN `status` ENUM('PLANNED', 'DONE', 'CANCELLED') NOT NULL DEFAULT 'PLANNED';

-- Rename rotation unit `PARTICIPANT` to `PERSON`: widen, backfill, narrow
ALTER TABLE `chore_assignments` MODIFY `rotation_unit` ENUM('PARTICIPANT', 'PERSON', 'ROOM') NOT NULL;
UPDATE `chore_assignments` SET `rotation_unit` = 'PERSON' WHERE `rotation_unit` = 'PARTICIPANT';
ALTER TABLE `chore_assignments` MODIFY `rotation_unit` ENUM('PERSON', 'ROOM') NOT NULL;

-- CreateTable
CREATE TABLE `chore_slots` (
    `id` CHAR(26) NOT NULL,
    `chore_id` CHAR(26) NOT NULL,
    `name` JSON NOT NULL,
    `time` VARCHAR(5) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `headcount` INTEGER UNSIGNED NULL,
    `supervisor_count` INTEGER UNSIGNED NULL,
    `effort` ENUM('LIGHT', 'NORMAL', 'HEAVY') NULL,

    UNIQUE INDEX `chore_slots_id_unique`(`id`),
    INDEX `chore_slots_chore_id_foreign`(`chore_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `chore_assignments_slot_id_foreign` ON `chore_assignments`(`slot_id`);

-- CreateIndex
CREATE INDEX `chore_assignments_batch_id_index` ON `chore_assignments`(`batch_id`);

-- AddForeignKey
ALTER TABLE `chore_slots` ADD CONSTRAINT `chore_slots_chore_id_foreign` FOREIGN KEY (`chore_id`) REFERENCES `chores`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chore_assignments` ADD CONSTRAINT `chore_assignments_slot_id_foreign` FOREIGN KEY (`slot_id`) REFERENCES `chore_slots`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
