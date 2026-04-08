/*
  Warnings:

  - Added the required column `farm_id` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "farm_id" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "User_farm_id_idx" ON "User"("farm_id");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
