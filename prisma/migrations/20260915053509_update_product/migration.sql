/*
  Warnings:

  - You are about to drop the column `trial` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "trial",
ADD COLUMN     "deployment" TEXT,
ADD COLUMN     "freeTrial" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reviewCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "shortDescription" TEXT,
ADD COLUMN     "supportedPlatforms" TEXT,
ADD COLUMN     "targetAudience" TEXT;
