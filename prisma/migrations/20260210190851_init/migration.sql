-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'DONE', 'CANCELED');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('APPLICATION', 'OTHER');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- CreateTable
CREATE TABLE "Farm" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Farm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Field" (
    "id" TEXT NOT NULL,
    "farm_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "area_ha" DECIMAL(10,2) NOT NULL,
    "geo_boundary" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Field_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "role" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FieldEvent" (
    "id" TEXT NOT NULL,
    "field_id" TEXT NOT NULL,
    "event_type" "EventType" NOT NULL,
    "status" "EventStatus" NOT NULL,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3) NOT NULL,
    "responsible_user_id" TEXT NOT NULL,
    "notes" TEXT,
    "source_document_id" TEXT,

    CONSTRAINT "FieldEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "event_id" TEXT NOT NULL,
    "application_name" TEXT NOT NULL,
    "work_rate_value" DECIMAL(10,2) NOT NULL,
    "work_rate_unit" TEXT NOT NULL,
    "spray_volume_total_l" DECIMAL(10,2),
    "spray_volume_l_per_ha" DECIMAL(10,2),
    "tank_count_planned" INTEGER,
    "tank_count_actual" INTEGER,
    "preferred_period" TEXT NOT NULL,
    "wind_min_kmh" INTEGER NOT NULL,
    "wind_max_kmh" INTEGER NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("event_id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "default_unit" TEXT NOT NULL,
    "manufacturer" TEXT,
    "notes" TEXT,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationItem" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "dose_per_ha" DECIMAL(10,4) NOT NULL,
    "dose_unit" TEXT NOT NULL,
    "total_planned" DECIMAL(12,3) NOT NULL,
    "total_unit" TEXT NOT NULL,
    "total_actual" DECIMAL(12,3),
    "total_actual_unit" TEXT,
    "spray_solution_l" DECIMAL(10,2),
    "packaging_count" INTEGER,
    "packaging_type" TEXT,

    CONSTRAINT "ApplicationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "action" "AuditAction" NOT NULL,
    "changed_by_user_id" TEXT NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "before_json" JSONB,
    "after_json" JSONB,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Field_farm_id_code_key" ON "Field"("farm_id", "code");

-- CreateIndex
CREATE INDEX "FieldEvent_field_id_idx" ON "FieldEvent"("field_id");

-- CreateIndex
CREATE INDEX "FieldEvent_responsible_user_id_idx" ON "FieldEvent"("responsible_user_id");

-- CreateIndex
CREATE INDEX "ApplicationItem_event_id_idx" ON "ApplicationItem"("event_id");

-- CreateIndex
CREATE INDEX "ApplicationItem_product_id_idx" ON "ApplicationItem"("product_id");

-- CreateIndex
CREATE INDEX "AuditLog_entity_type_entity_id_idx" ON "AuditLog"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "AuditLog_changed_by_user_id_idx" ON "AuditLog"("changed_by_user_id");

-- AddForeignKey
ALTER TABLE "Field" ADD CONSTRAINT "Field_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldEvent" ADD CONSTRAINT "FieldEvent_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "Field"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldEvent" ADD CONSTRAINT "FieldEvent_responsible_user_id_fkey" FOREIGN KEY ("responsible_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldEvent" ADD CONSTRAINT "FieldEvent_source_document_id_fkey" FOREIGN KEY ("source_document_id") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "FieldEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationItem" ADD CONSTRAINT "ApplicationItem_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "FieldEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationItem" ADD CONSTRAINT "ApplicationItem_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_changed_by_user_id_fkey" FOREIGN KEY ("changed_by_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
