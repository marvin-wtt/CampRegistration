-- CreateTable
CREATE TABLE `jobs` (
    `id` CHAR(26) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `queue` VARCHAR(255) NOT NULL,
    `payload` JSON NOT NULL,
    `status` ENUM('PENDING', 'RUNNING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `priority` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `error` TEXT NULL,
    `run_at` DATETIME NULL,
    `reserved_at` DATETIME NULL,
    `finished_at` DATETIME NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    UNIQUE INDEX `jobs_id_unique`(`id`),
    INDEX `jobs_status_run_at_index`(`status`, `run_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `job_rate_limits` (
    `queue` VARCHAR(255) NOT NULL,
    `tokens` DOUBLE NOT NULL,
    `refilled_at` DATETIME NOT NULL,

    PRIMARY KEY (`queue`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
