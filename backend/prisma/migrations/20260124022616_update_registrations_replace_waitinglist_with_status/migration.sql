-- AlterTable
ALTER TABLE `camps`
  ADD COLUMN `auto_accept_registrations` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `registrations`
  ADD COLUMN `status` ENUM('ACCEPTED', 'PENDING', 'WAITLISTED') NOT NULL DEFAULT 'PENDING';

-- UpdateData
UPDATE `registrations`
SET `status` = 'ACCEPTED'
WHERE `waiting_list` = false;

-- UpdateData
UPDATE `registrations`
SET `status` = 'WAITLISTED'
WHERE `waiting_list` = true;

-- AlterTable
ALTER TABLE `registrations` DROP COLUMN `waiting_list`;
