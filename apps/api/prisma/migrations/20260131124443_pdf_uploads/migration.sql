-- CreateTable
CREATE TABLE "PdfUpload" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalParsed" INTEGER NOT NULL,
    "totalSaved" INTEGER NOT NULL,
    "lowConfidenceCount" INTEGER NOT NULL,

    CONSTRAINT "PdfUpload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PdfUpload_userId_idx" ON "PdfUpload"("userId");

-- CreateIndex
CREATE INDEX "PdfUpload_uploadedAt_idx" ON "PdfUpload"("uploadedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PdfUpload_userId_fileHash_key" ON "PdfUpload"("userId", "fileHash");

-- AddForeignKey
ALTER TABLE "PdfUpload" ADD CONSTRAINT "PdfUpload_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
