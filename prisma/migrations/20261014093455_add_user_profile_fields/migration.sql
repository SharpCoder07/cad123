-- AlterTable
ALTER TABLE "User" ADD COLUMN     "department" TEXT,
ADD COLUMN     "image" TEXT,
ADD COLUMN     "jobTitle" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata';
