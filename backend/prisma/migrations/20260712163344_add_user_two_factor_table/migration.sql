/*
  Warnings:

  - You are about to drop the column `totp_secret` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `two_factor_enabled` on the `users` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `two_factor_recovery_codes` DROP FOREIGN KEY `two_factor_recovery_codes_user_id_foreign`;

-- CreateTable
CREATE TABLE `user_two_factor`
(
  `user_id`         CHAR(26) NOT NULL,
  `secret`          CHAR(32) NOT NULL,
  `confirmed_at`    DATETIME(3) NULL,
  `failed_attempts` INTEGER  NOT NULL DEFAULT 0,
  `locked_until`    DATETIME(3) NULL,
  `created_at`      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`      DATETIME(3) NULL,

  PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


INSERT INTO `user_two_factor` (`user_id`, `secret`, `confirmed_at`)
SELECT `id`,
       `totp_secret`,
       CURRENT_TIMESTAMP(3)
FROM `users`
WHERE `two_factor_enabled` = TRUE
  AND `totp_secret` IS NOT NULL;

-- AlterTable
ALTER TABLE `users` DROP COLUMN `totp_secret`,
DROP
COLUMN `two_factor_enabled`;

-- AddForeignKey
ALTER TABLE `user_two_factor`
  ADD CONSTRAINT `user_two_factor_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `two_factor_recovery_codes`
  ADD CONSTRAINT `two_factor_recovery_codes_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `user_two_factor` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;
