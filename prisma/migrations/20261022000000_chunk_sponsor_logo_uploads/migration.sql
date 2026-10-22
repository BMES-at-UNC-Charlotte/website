CREATE TABLE "SponsorshipLogoChunk" (
    "uploadId" TEXT NOT NULL,
    "chunk" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SponsorshipLogoChunk_pkey" PRIMARY KEY ("uploadId", "chunk")
);

CREATE INDEX "SponsorshipLogoChunk_createdAt_idx" ON "SponsorshipLogoChunk"("createdAt");
