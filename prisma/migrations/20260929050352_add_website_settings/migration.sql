-- CreateTable
CREATE TABLE "WebsiteSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "primaryColor" TEXT NOT NULL DEFAULT '#2563EB',
    "secondaryColor" TEXT NOT NULL DEFAULT '#0F172A',
    "accentColor" TEXT NOT NULL DEFAULT '#14B8A6',
    "accent2Color" TEXT NOT NULL DEFAULT '#F97316',
    "backgroundColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "textColor" TEXT NOT NULL DEFAULT '#0F172A',
    "mutedTextColor" TEXT NOT NULL DEFAULT '#64748B',
    "borderColor" TEXT NOT NULL DEFAULT '#E2E8F0',
    "surfaceColor" TEXT NOT NULL DEFAULT '#F8FAFC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebsiteSettings_pkey" PRIMARY KEY ("id")
);
