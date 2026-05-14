-- CreateEnum
CREATE TYPE "SeedQuantityUnit" AS ENUM ('SEED_M', 'KG_HA');

-- AlterTable
ALTER TABLE "Field" ADD COLUMN     "soil_analysis_document_id" TEXT;

-- AlterTable
ALTER TABLE "FieldEvent" ADD COLUMN     "crop" TEXT,
ADD COLUMN     "execution_method" "ExecutionMethod",
ADD COLUMN     "rainfall_mm" DECIMAL(10,2),
ADD COLUMN     "seed_quantity" DECIMAL(12,3),
ADD COLUMN     "seed_quantity_unit" "SeedQuantityUnit",
ADD COLUMN     "variety" TEXT;

-- CreateIndex
CREATE INDEX "Field_farm_id_idx" ON "Field"("farm_id");

-- CreateIndex
CREATE INDEX "Field_soil_analysis_document_id_idx" ON "Field"("soil_analysis_document_id");

-- CreateIndex
CREATE INDEX "FieldEvent_source_document_id_idx" ON "FieldEvent"("source_document_id");

-- AddForeignKey
ALTER TABLE "Field" ADD CONSTRAINT "Field_soil_analysis_document_id_fkey" FOREIGN KEY ("soil_analysis_document_id") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;
