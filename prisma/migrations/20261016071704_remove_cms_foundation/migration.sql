/*
  Warnings:

  - You are about to drop the `CmsDocument` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CmsRevision` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CmsRevision" DROP CONSTRAINT "CmsRevision_documentId_fkey";

-- DropTable
DROP TABLE "CmsDocument";

-- DropTable
DROP TABLE "CmsRevision";

-- DropEnum
DROP TYPE "CmsDocumentType";
