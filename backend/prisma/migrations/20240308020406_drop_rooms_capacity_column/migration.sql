/*
  Warnings:

  - You are about to drop the column `capacity` on the `rooms` table. All the data in the column will be lost.
  - You are about to drop the `program_events` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `program_events` DROP FOREIGN KEY `program_events_camp_id_fkey`;

-- AlterTable
ALTER TABLE `rooms` DROP COLUMN `capacity`;

-- DropTable
DROP TABLE `program_events`;
