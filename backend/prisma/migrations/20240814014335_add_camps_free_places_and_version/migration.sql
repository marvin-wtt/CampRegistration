/*
  Note:
   The free_places column was first added so that all existing columns have a valid value.
   It is revered in the following query as it should not have a default value.
*/

-- AlterTable
ALTER TABLE `camps` ADD COLUMN `free_places` JSON NOT NULL DEFAULT 0,
    ADD COLUMN `version` INTEGER UNSIGNED NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `camps` ALTER COLUMN `free_places` DROP DEFAULT;
