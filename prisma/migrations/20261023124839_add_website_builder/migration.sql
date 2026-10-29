-- CreateEnum
CREATE TYPE "WebsitePageStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "WebsiteVersionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "WebsitePage" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "WebsitePageStatus" NOT NULL DEFAULT 'ACTIVE',
    "publishedVersion" INTEGER,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "seoImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebsitePage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebsitePageVersion" (
    "id" SERIAL NOT NULL,
    "pageId" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "WebsiteVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "settings" JSONB,
    "createdById" INTEGER,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebsitePageVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebsiteSection" (
    "id" SERIAL NOT NULL,
    "versionId" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "settings" JSONB,
    "styles" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebsiteSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebsiteElement" (
    "id" SERIAL NOT NULL,
    "sectionId" INTEGER NOT NULL,
    "parentId" INTEGER,
    "key" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "content" JSONB,
    "styles" JSONB,
    "responsive" JSONB,
    "action" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebsiteElement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebsiteTheme" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT NOT NULL DEFAULT 'Default',
    "tokens" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebsiteTheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebsiteAsset" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER,
    "altText" TEXT,
    "metadata" JSONB,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebsiteAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WebsitePage_slug_key" ON "WebsitePage"("slug");

-- CreateIndex
CREATE INDEX "WebsitePage_status_idx" ON "WebsitePage"("status");

-- CreateIndex
CREATE INDEX "WebsitePageVersion_pageId_status_idx" ON "WebsitePageVersion"("pageId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "WebsitePageVersion_pageId_version_key" ON "WebsitePageVersion"("pageId", "version");

-- CreateIndex
CREATE INDEX "WebsiteSection_versionId_sortOrder_idx" ON "WebsiteSection"("versionId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "WebsiteSection_versionId_key_key" ON "WebsiteSection"("versionId", "key");

-- CreateIndex
CREATE INDEX "WebsiteElement_sectionId_sortOrder_idx" ON "WebsiteElement"("sectionId", "sortOrder");

-- CreateIndex
CREATE INDEX "WebsiteElement_parentId_idx" ON "WebsiteElement"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "WebsiteElement_sectionId_key_key" ON "WebsiteElement"("sectionId", "key");

-- CreateIndex
CREATE INDEX "WebsiteAsset_mimeType_idx" ON "WebsiteAsset"("mimeType");

-- AddForeignKey
ALTER TABLE "WebsitePageVersion" ADD CONSTRAINT "WebsitePageVersion_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "WebsitePage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebsiteSection" ADD CONSTRAINT "WebsiteSection_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "WebsitePageVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebsiteElement" ADD CONSTRAINT "WebsiteElement_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "WebsiteSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebsiteElement" ADD CONSTRAINT "WebsiteElement_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "WebsiteElement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
