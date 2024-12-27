/*
  Warnings:

  - Made the column `category` on table `expenses` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `expenses` MODIFY `category` VARCHAR(191) NOT NULL;
