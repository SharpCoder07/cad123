-- CreateTable
CREATE TABLE "ProductAlternative" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productId" INTEGER NOT NULL,
    "alternativeId" INTEGER NOT NULL,

    CONSTRAINT "ProductAlternative_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductAlternative_productId_idx" ON "ProductAlternative"("productId");

-- CreateIndex
CREATE INDEX "ProductAlternative_alternativeId_idx" ON "ProductAlternative"("alternativeId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductAlternative_productId_alternativeId_key" ON "ProductAlternative"("productId", "alternativeId");

-- AddForeignKey
ALTER TABLE "ProductAlternative" ADD CONSTRAINT "ProductAlternative_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAlternative" ADD CONSTRAINT "ProductAlternative_alternativeId_fkey" FOREIGN KEY ("alternativeId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
