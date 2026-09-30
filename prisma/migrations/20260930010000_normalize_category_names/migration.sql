UPDATE "Category"
SET "name" = initcap(lower(regexp_replace(trim("name"), '[[:space:]]+', ' ', 'g')))
WHERE "name" <> initcap(lower(regexp_replace(trim("name"), '[[:space:]]+', ' ', 'g')));
