-- CreateEnum
CREATE TYPE "ExecutionMethod" AS ENUM ('DISTRIBUTING', 'INCORPORATION');

-- CreateEnum
CREATE TYPE "ApplicationMedium" AS ENUM ('DRONE', 'AIRCRAFT', 'TERRESTRIAL');

-- CreateEnum
CREATE TYPE "ProductState" AS ENUM ('LIQUID', 'SOLID');

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "application_medium" "ApplicationMedium" NOT NULL DEFAULT 'TERRESTRIAL',
ADD COLUMN     "execution_method" "ExecutionMethod",
ADD COLUMN     "humidity_min" INTEGER,
ADD COLUMN     "product_state" "ProductState" NOT NULL DEFAULT 'LIQUID',
ADD COLUMN     "temp_max_c" INTEGER,
ADD COLUMN     "temp_min_c" INTEGER;
