-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "file_size_bytes" INTEGER,
ADD COLUMN     "public_url" TEXT,
ADD COLUMN     "resource_type" TEXT,
ADD COLUMN     "secure_url" TEXT,
ADD COLUMN     "storage_key" TEXT,
ADD COLUMN     "storage_provider" TEXT NOT NULL DEFAULT 'LOCAL';

-- AlterTable
ALTER TABLE "Farm" ADD COLUMN     "farm_map_document_id" TEXT;

-- CreateIndex
CREATE INDEX "Document_storage_key_idx" ON "Document"("storage_key");

-- CreateIndex
CREATE INDEX "Document_storage_provider_idx" ON "Document"("storage_provider");

-- CreateIndex
CREATE INDEX "Farm_farm_map_document_id_idx" ON "Farm"("farm_map_document_id");

-- AddForeignKey
ALTER TABLE "Farm" ADD CONSTRAINT "Farm_farm_map_document_id_fkey" FOREIGN KEY ("farm_map_document_id") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;
