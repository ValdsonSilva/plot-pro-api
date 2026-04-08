/*
  Warnings:

  - The values [APPLICATION,OTHER] on the enum `EventType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EventType_new" AS ENUM ('SOIL_PLOWING', 'SOIL_HARROWING', 'SOIL_SUBSOILING', 'LIMING', 'GYPSUM_APPLICATION', 'PLANTING', 'FERTILIZATION', 'PESTICIDE_APPLICATION', 'IRRIGATION', 'HARVEST', 'MONITORING');
ALTER TABLE "FieldEvent" ALTER COLUMN "event_type" TYPE "EventType_new" USING ("event_type"::text::"EventType_new");
ALTER TYPE "EventType" RENAME TO "EventType_old";
ALTER TYPE "EventType_new" RENAME TO "EventType";
DROP TYPE "public"."EventType_old";
COMMIT;
