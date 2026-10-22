BEGIN;

-- Rename in place so existing pages, URLs, and comments are preserved.
ALTER TABLE "Survey" RENAME TO "EmbeddedPage";
ALTER TABLE "EmbeddedPage" RENAME COLUMN "description" TO "comment";
ALTER TABLE "EmbeddedPage" RENAME COLUMN "formUrl" TO "url";
ALTER TABLE "EmbeddedPage" RENAME CONSTRAINT "Survey_pkey" TO "EmbeddedPage_pkey";
ALTER INDEX "Survey_path_key" RENAME TO "EmbeddedPage_path_key";
ALTER INDEX "Survey_closesOn_idx" RENAME TO "EmbeddedPage_closesOn_idx";

COMMIT;
