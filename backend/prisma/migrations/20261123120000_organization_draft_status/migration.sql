-- AlterTable
ALTER TABLE `organizations` MODIFY `verification_status` ENUM('DRAFT', 'PENDING', 'VERIFIED', 'REJECTED') NOT NULL DEFAULT 'DRAFT',
    MODIFY `submitted_at` DATETIME(3) NULL;
