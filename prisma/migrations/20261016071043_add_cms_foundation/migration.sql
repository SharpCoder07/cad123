-- CreateEnum
CREATE TYPE "CmsDocumentType" AS ENUM ('PAGE', 'PRODUCT_TEMPLATE', 'CATEGORY_TEMPLATE', 'BLOG_POST_TEMPLATE', 'BLOG_ARCHIVE_TEMPLATE', 'HEADER', 'FOOTER', 'GLOBAL_DESIGN');

-- CreateTable
CREATE TABLE "CmsDocument" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CmsDocumentType" NOT NULL,
    "path" TEXT,
    "draft" JSONB NOT NULL,
    "draftVersion" INTEGER NOT NULL DEFAULT 1,
    "published" JSONB,
    "publishedVersion" INTEGER,
    "publishedAt" TIMESTAMP(3),
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CmsDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CmsRevision" (
    "id" SERIAL NOT NULL,
    "documentId" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CmsRevision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CmsDocument_key_key" ON "CmsDocument"("key");

-- CreateIndex
CREATE UNIQUE INDEX "CmsDocument_path_key" ON "CmsDocument"("path");

-- CreateIndex
CREATE INDEX "CmsDocument_type_idx" ON "CmsDocument"("type");

-- CreateIndex
CREATE INDEX "CmsRevision_documentId_createdAt_idx" ON "CmsRevision"("documentId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CmsRevision_documentId_version_key" ON "CmsRevision"("documentId", "version");

-- AddForeignKey
ALTER TABLE "CmsRevision" ADD CONSTRAINT "CmsRevision_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "CmsDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
