-- CreateTable
CREATE TABLE `audit_logs` (
    `id` CHAR(26) NOT NULL,
    `action` VARCHAR(64) NOT NULL,
    `entity_type` VARCHAR(64) NOT NULL,
    `entity_id` CHAR(26) NOT NULL,
    `camp_id` CHAR(26) NULL,
    `actor_id` CHAR(26) NULL,
    `actor_ip` VARCHAR(45) NULL,
    `changes` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `audit_logs_id_unique`(`id`),
    INDEX `audit_logs_entity_index`(`entity_type`, `entity_id`),
    INDEX `audit_logs_camp_id_created_at_index`(`camp_id`, `created_at`),
    INDEX `audit_logs_actor_id_index`(`actor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
