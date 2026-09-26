/*
  Warnings:

  - You are about to drop the column `deletedAt` on the `registrations` table. All the data in the column will be lost.

*/

DELETE
FROM `registrations`
WHERE `deletedAt` IS NOT NULL;

-- AlterTable
ALTER TABLE `registrations` DROP COLUMN `deletedAt`;
