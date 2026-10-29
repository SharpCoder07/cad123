-- CreateTable
CREATE TABLE "WebsiteSectionTemplate" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebsiteSectionTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WebsiteSectionTemplate_name_idx" ON "WebsiteSectionTemplate"("name");

-- CreateIndex
CREATE INDEX "WebsiteSectionTemplate_type_idx" ON "WebsiteSectionTemplate"("type");

-- CreateIndex
CREATE INDEX "WebsiteSectionTemplate_createdAt_idx" ON "WebsiteSectionTemplate"("createdAt");
