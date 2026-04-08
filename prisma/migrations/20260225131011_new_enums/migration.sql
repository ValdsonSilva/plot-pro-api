/*
  Warnings:

  - The `product_classification` column on the `ApplicationItem` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `category` on the `Product` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('DEFENSIVO_AGRICOLA', 'FERTILIZANTE', 'SEMENTE', 'ADJUVANTE', 'BIOLOGICO', 'OUTRO');

-- CreateEnum
CREATE TYPE "ProductClassification" AS ENUM ('HERBICIDA', 'INSETICIDA', 'FUNGICIDA', 'NEMATICIDA', 'ACARICIDA', 'BACTERICIDA', 'REGULADOR_CRESCIMENTO', 'FERTILIZANTE_SOLO', 'FERTILIZANTE_FOLIAR', 'BIOESTIMULANTE', 'INSETICIDA_BIOLOGICO', 'FUNGICIDA_BIOLOGICO', 'NEMATICIDA_BIOLOGICO');

-- AlterTable
ALTER TABLE "ApplicationItem" DROP COLUMN "product_classification",
ADD COLUMN     "product_classification" "ProductClassification";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "category",
ADD COLUMN     "category" "ProductCategory" NOT NULL;
