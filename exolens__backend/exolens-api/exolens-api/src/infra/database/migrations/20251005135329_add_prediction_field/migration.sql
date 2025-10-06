/*
  Warnings:

  - Added the required column `existing_data` to the `predictions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "predictions" ADD COLUMN     "existing_data" BOOLEAN NOT NULL;
