DO $$ BEGIN
  CREATE TYPE "ProductSupplier" AS ENUM ('AM_EMBUTIDOS', 'MARCHEF', 'BONI');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "supplier" "ProductSupplier";
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "supplier" "ProductSupplier";
