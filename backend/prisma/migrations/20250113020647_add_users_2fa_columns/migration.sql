-- AlterTable
ALTER TABLE `tokens` MODIFY `type` ENUM('ACCESS', 'REFRESH', 'RESET_PASSWORD', 'VERIFY_EMAIL', 'OTP') NOT NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `totp_secret` CHAR(32) NULL,
    ADD COLUMN `two_factor_enabled` BOOLEAN NOT NULL DEFAULT false;
