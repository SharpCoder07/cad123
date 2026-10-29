-- AlterTable
ALTER TABLE "WebsiteSection" ADD COLUMN     "globalSectionId" INTEGER;

-- CreateTable
CREATE TABLE "WebsiteGlobalSection" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "data" JSONB NOT NULL,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebsiteGlobalSection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WebsiteGlobalSection_name_idx" ON "WebsiteGlobalSection"("name");

-- CreateIndex
CREATE INDEX "WebsiteGlobalSection_type_idx" ON "WebsiteGlobalSection"("type");

-- CreateIndex
CREATE INDEX "WebsiteGlobalSection_updatedAt_idx" ON "WebsiteGlobalSection"("updatedAt");

-- CreateIndex
CREATE INDEX "WebsiteSection_globalSectionId_idx" ON "WebsiteSection"("globalSectionId");

-- AddForeignKey
ALTER TABLE "WebsiteSection" ADD CONSTRAINT "WebsiteSection_globalSectionId_fkey" FOREIGN KEY ("globalSectionId") REFERENCES "WebsiteGlobalSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
