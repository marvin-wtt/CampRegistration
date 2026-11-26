-- AlterTable
ALTER TABLE `expenses` ADD COLUMN `paid_on` CHAR(10) NULL;

-- Every expense so far was paid: on its receipt date, or when it was recorded
-- while the receipt was still to come.
UPDATE `expenses` SET `paid_on` = COALESCE(`date`, DATE_FORMAT(`created_at`, '%Y-%m-%d'));
