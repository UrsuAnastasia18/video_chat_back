UPDATE "Book"
SET "resourceUrl" = '/manuals/worksheets-grammar.pdf'
WHERE "resourceUrl" IS NULL OR btrim("resourceUrl") = '';

ALTER TABLE "Book"
ALTER COLUMN "resourceUrl" SET NOT NULL;
