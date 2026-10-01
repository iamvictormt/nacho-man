-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN_MASTER', 'ADMIN', 'FRANCHISEE', 'USER');

-- CreateEnum
CREATE TYPE "ProductUnit" AS ENUM ('KG', 'UND', 'CX');

-- CreateEnum
CREATE TYPE "ProductAudience" AS ENUM ('FRANCHISEE', 'PUBLIC');

-- CreateEnum
CREATE TYPE "ProductSupplier" AS ENUM ('AM_EMBUTIDOS', 'MARCHEF', 'BONI');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateEnum
CREATE TYPE "PromotionScope" AS ENUM ('PRODUCT', 'CATEGORY', 'ORDER');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('DRAFT', 'AWAITING_SERVICE', 'AWAITING_PAYMENT', 'PAYMENT_CONFIRMED', 'PICKING', 'INVOICED', 'READY_FOR_PICKUP', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PIX', 'CARD', 'BOLETO');

-- CreateEnum
CREATE TYPE "OrderFulfillmentMethod" AS ENUM ('FACTORY_PICKUP', 'SHIP_BY_CARRIER');

-- CreateEnum
CREATE TYPE "MarketplaceCartItemType" AS ENUM ('PRODUCT', 'COMBO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "role" "UserRole" NOT NULL,
    "canAccessIndicators" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "franchiseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "IndicatorAnalysis" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "model" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndicatorAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaiposSale" (
    "id" TEXT NOT NULL,
    "idStore" INTEGER NOT NULL,
    "idSale" BIGINT NOT NULL,
    "idSaleType" INTEGER NOT NULL,
    "createdAtSaipos" TIMESTAMP(3) NOT NULL,
    "updatedAtSaipos" TIMESTAMP(3),
    "shiftDate" TIMESTAMP(3),
    "canceled" BOOLEAN NOT NULL DEFAULT false,
    "totalAmountInCents" INTEGER NOT NULL DEFAULT 0,
    "totalDiscountInCents" INTEGER NOT NULL DEFAULT 0,
    "totalIncreaseInCents" INTEGER NOT NULL DEFAULT 0,
    "totalAmountItemsInCents" INTEGER NOT NULL DEFAULT 0,
    "paymentMethod" TEXT,
    "partnerName" TEXT,
    "partnerStatus" TEXT,
    "raw" JSONB NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaiposSale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaiposSalePayment" (
    "id" TEXT NOT NULL,
    "idStore" INTEGER NOT NULL,
    "idSale" BIGINT NOT NULL,
    "paymentIndex" INTEGER NOT NULL,
    "paymentAmountInCents" INTEGER NOT NULL DEFAULT 0,
    "paymentType" TEXT,
    "changeForInCents" INTEGER NOT NULL DEFAULT 0,
    "createdAtSaipos" TIMESTAMP(3),
    "raw" JSONB NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaiposSalePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaiposSaleItem" (
    "id" TEXT NOT NULL,
    "idStore" INTEGER NOT NULL,
    "idSale" BIGINT NOT NULL,
    "idSaleItem" BIGINT NOT NULL,
    "idStoreItem" INTEGER,
    "idStoreVariation" INTEGER,
    "descSaleItem" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unitPriceInCents" INTEGER NOT NULL DEFAULT 0,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "status" INTEGER,
    "createdAtSaipos" TIMESTAMP(3),
    "updatedAtSaipos" TIMESTAMP(3),
    "doneAt" TIMESTAMP(3),
    "choices" JSONB,
    "raw" JSONB NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaiposSaleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaiposSaleStatusHistory" (
    "id" TEXT NOT NULL,
    "idStore" INTEGER NOT NULL,
    "idSale" BIGINT NOT NULL,
    "idSaleStatusHistory" BIGINT NOT NULL,
    "statusOrder" INTEGER,
    "statusDescription" TEXT,
    "durationTimeSeconds" INTEGER,
    "cancellationReason" TEXT,
    "userId" INTEGER,
    "userName" TEXT,
    "userEmail" TEXT,
    "userType" INTEGER,
    "authorizedByUserId" INTEGER,
    "authorizedByUserName" TEXT,
    "authorizedByUserEmail" TEXT,
    "authorizedByUserType" INTEGER,
    "createdAtSaipos" TIMESTAMP(3),
    "raw" JSONB NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaiposSaleStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaiposProductReference" (
    "id" TEXT NOT NULL,
    "productKey" TEXT NOT NULL,
    "idStore" INTEGER NOT NULL,
    "idStoreItem" INTEGER,
    "idStoreVariation" INTEGER,
    "integrationCode" TEXT,
    "name" TEXT NOT NULL,
    "firstSeenAtSaipos" TIMESTAMP(3),
    "lastSeenAtSaipos" TIMESTAMP(3),
    "lastSoldAtSaipos" TIMESTAMP(3),
    "raw" JSONB,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaiposProductReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaiposStockMovement" (
    "id" TEXT NOT NULL,
    "idStore" INTEGER NOT NULL,
    "idStoreIngredMovement" BIGINT NOT NULL,
    "idStoreIngredient" BIGINT,
    "idMovementType" INTEGER,
    "dateMovement" TIMESTAMP(3),
    "createdAtSaipos" TIMESTAMP(3),
    "quantityText" TEXT,
    "quantityNumber" DOUBLE PRECISION,
    "quantityEntryText" TEXT,
    "unitCostInCents" INTEGER NOT NULL DEFAULT 0,
    "movementCostInCents" INTEGER NOT NULL DEFAULT 0,
    "saleId" BIGINT,
    "saleNumber" INTEGER,
    "notes" TEXT,
    "ingredientName" TEXT,
    "ingredientGroupId" BIGINT,
    "ingredientGroupName" TEXT,
    "currentInventory" DOUBLE PRECISION,
    "minimumStock" DOUBLE PRECISION,
    "averageCostInCents" INTEGER NOT NULL DEFAULT 0,
    "averageCostMethod" TEXT,
    "controlInventory" BOOLEAN NOT NULL DEFAULT false,
    "includeInCmvCalc" BOOLEAN NOT NULL DEFAULT false,
    "unitMeasure" TEXT,
    "identificationNfItem" TEXT,
    "identificationNfItemId" BIGINT,
    "raw" JSONB NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaiposStockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaiposFinancialTransaction" (
    "id" TEXT NOT NULL,
    "idStore" INTEGER NOT NULL,
    "idStoreFinTransaction" BIGINT NOT NULL,
    "amountInCents" INTEGER NOT NULL DEFAULT 0,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "conciliated" BOOLEAN NOT NULL DEFAULT false,
    "installment" INTEGER,
    "totalInstallments" INTEGER,
    "providerTradeName" TEXT,
    "bankAccountDescription" TEXT,
    "paymentMethodDescription" TEXT,
    "transactionDescription" TEXT,
    "financialCategoryDescription" TEXT,
    "date" TIMESTAMP(3),
    "paymentDate" TIMESTAMP(3),
    "issuanceDate" TIMESTAMP(3),
    "createdAtSaipos" TIMESTAMP(3),
    "updatedAtSaipos" TIMESTAMP(3),
    "children" JSONB,
    "raw" JSONB NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaiposFinancialTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaiposSyncRun" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "dateColumn" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "recordsFetched" INTEGER NOT NULL DEFAULT 0,
    "recordsUpserted" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "SaiposSyncRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Franchise" (
    "id" TEXT NOT NULL,
    "tradeName" TEXT NOT NULL,
    "legalName" TEXT,
    "document" TEXT,
    "whatsapp" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "priceDiscount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Franchise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "tradeName" TEXT NOT NULL,
    "document" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "complement" TEXT,
    "district" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "franchiseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "features" TEXT,
    "applications" TEXT,
    "storageInfo" TEXT,
    "usageInfo" TEXT,
    "yieldInfo" TEXT,
    "image" TEXT,
    "sku" TEXT,
    "priceInCents" INTEGER NOT NULL,
    "unit" "ProductUnit" NOT NULL,
    "audience" "ProductAudience" NOT NULL DEFAULT 'FRANCHISEE',
    "packageLabel" TEXT NOT NULL,
    "supplier" "ProductSupplier",
    "minimumQuantity" INTEGER NOT NULL DEFAULT 1,
    "stockQuantity" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "paymentDiscountEligible" BOOLEAN NOT NULL DEFAULT true,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Combo" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "priceInCents" INTEGER NOT NULL,
    "audience" "ProductAudience" NOT NULL DEFAULT 'FRANCHISEE',
    "totalUnits" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Combo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceCartItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemKey" TEXT NOT NULL,
    "type" "MarketplaceCartItemType" NOT NULL,
    "productId" TEXT,
    "comboId" TEXT,
    "selectionKey" TEXT,
    "selectedOptions" JSONB,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceCartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComboItem" (
    "id" TEXT NOT NULL,
    "comboId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ComboItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "DiscountType" NOT NULL,
    "value" INTEGER NOT NULL,
    "scope" "PromotionScope" NOT NULL,
    "productId" TEXT,
    "categoryId" TEXT,
    "minimumQuantity" INTEGER,
    "minimumInCents" INTEGER,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "type" "DiscountType" NOT NULL,
    "value" INTEGER NOT NULL,
    "minimumInCents" INTEGER,
    "maximumUses" INTEGER,
    "uses" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "number" SERIAL NOT NULL,
    "franchiseId" TEXT,
    "userId" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'AWAITING_SERVICE',
    "paymentMethod" "PaymentMethod" NOT NULL,
    "fulfillmentMethod" "OrderFulfillmentMethod" NOT NULL DEFAULT 'SHIP_BY_CARRIER',
    "scheduledPickupAt" TIMESTAMP(3),
    "couponId" TEXT,
    "subtotalInCents" INTEGER NOT NULL,
    "promotionDiscountInCents" INTEGER NOT NULL DEFAULT 0,
    "couponDiscountInCents" INTEGER NOT NULL DEFAULT 0,
    "pixDiscountInCents" INTEGER NOT NULL DEFAULT 0,
    "shippingInCents" INTEGER NOT NULL DEFAULT 0,
    "totalInCents" INTEGER NOT NULL,
    "notes" TEXT,
    "deliveryAddress" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT,
    "comboId" TEXT,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "unit" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPriceInCents" INTEGER NOT NULL,
    "totalInCents" INTEGER NOT NULL,
    "selectedOptions" JSONB,
    "supplier" "ProductSupplier",

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderStatusHistory" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_franchiseId_key" ON "User"("franchiseId");

-- CreateIndex
CREATE INDEX "PasswordResetCode_userId_code_idx" ON "PasswordResetCode"("userId", "code");

-- CreateIndex
CREATE INDEX "PasswordResetCode_expiresAt_idx" ON "PasswordResetCode"("expiresAt");

-- CreateIndex
CREATE INDEX "IndicatorAnalysis_userId_createdAt_idx" ON "IndicatorAnalysis"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SaiposSale_createdAtSaipos_idx" ON "SaiposSale"("createdAtSaipos");

-- CreateIndex
CREATE INDEX "SaiposSale_shiftDate_idx" ON "SaiposSale"("shiftDate");

-- CreateIndex
CREATE INDEX "SaiposSale_idStore_createdAtSaipos_idx" ON "SaiposSale"("idStore", "createdAtSaipos");

-- CreateIndex
CREATE UNIQUE INDEX "SaiposSale_idStore_idSale_key" ON "SaiposSale"("idStore", "idSale");

-- CreateIndex
CREATE INDEX "SaiposSalePayment_idStore_idSale_idx" ON "SaiposSalePayment"("idStore", "idSale");

-- CreateIndex
CREATE INDEX "SaiposSalePayment_paymentType_idx" ON "SaiposSalePayment"("paymentType");

-- CreateIndex
CREATE INDEX "SaiposSalePayment_createdAtSaipos_idx" ON "SaiposSalePayment"("createdAtSaipos");

-- CreateIndex
CREATE UNIQUE INDEX "SaiposSalePayment_idStore_idSale_paymentIndex_key" ON "SaiposSalePayment"("idStore", "idSale", "paymentIndex");

-- CreateIndex
CREATE INDEX "SaiposSaleItem_idStore_idSale_idx" ON "SaiposSaleItem"("idStore", "idSale");

-- CreateIndex
CREATE INDEX "SaiposSaleItem_idStoreItem_idx" ON "SaiposSaleItem"("idStoreItem");

-- CreateIndex
CREATE INDEX "SaiposSaleItem_createdAtSaipos_idx" ON "SaiposSaleItem"("createdAtSaipos");

-- CreateIndex
CREATE UNIQUE INDEX "SaiposSaleItem_idStore_idSaleItem_key" ON "SaiposSaleItem"("idStore", "idSaleItem");

-- CreateIndex
CREATE INDEX "SaiposSaleStatusHistory_idStore_idSale_idx" ON "SaiposSaleStatusHistory"("idStore", "idSale");

-- CreateIndex
CREATE INDEX "SaiposSaleStatusHistory_statusDescription_idx" ON "SaiposSaleStatusHistory"("statusDescription");

-- CreateIndex
CREATE INDEX "SaiposSaleStatusHistory_createdAtSaipos_idx" ON "SaiposSaleStatusHistory"("createdAtSaipos");

-- CreateIndex
CREATE UNIQUE INDEX "SaiposSaleStatusHistory_idStore_idSaleStatusHistory_key" ON "SaiposSaleStatusHistory"("idStore", "idSaleStatusHistory");

-- CreateIndex
CREATE UNIQUE INDEX "SaiposProductReference_productKey_key" ON "SaiposProductReference"("productKey");

-- CreateIndex
CREATE INDEX "SaiposProductReference_idStore_idx" ON "SaiposProductReference"("idStore");

-- CreateIndex
CREATE INDEX "SaiposProductReference_idStore_idStoreItem_idx" ON "SaiposProductReference"("idStore", "idStoreItem");

-- CreateIndex
CREATE INDEX "SaiposProductReference_integrationCode_idx" ON "SaiposProductReference"("integrationCode");

-- CreateIndex
CREATE INDEX "SaiposProductReference_name_idx" ON "SaiposProductReference"("name");

-- CreateIndex
CREATE INDEX "SaiposStockMovement_idStore_idx" ON "SaiposStockMovement"("idStore");

-- CreateIndex
CREATE INDEX "SaiposStockMovement_dateMovement_idx" ON "SaiposStockMovement"("dateMovement");

-- CreateIndex
CREATE INDEX "SaiposStockMovement_idStoreIngredient_idx" ON "SaiposStockMovement"("idStoreIngredient");

-- CreateIndex
CREATE INDEX "SaiposStockMovement_saleId_idx" ON "SaiposStockMovement"("saleId");

-- CreateIndex
CREATE INDEX "SaiposStockMovement_includeInCmvCalc_idx" ON "SaiposStockMovement"("includeInCmvCalc");

-- CreateIndex
CREATE UNIQUE INDEX "SaiposStockMovement_idStore_idStoreIngredMovement_key" ON "SaiposStockMovement"("idStore", "idStoreIngredMovement");

-- CreateIndex
CREATE INDEX "SaiposFinancialTransaction_idStore_idx" ON "SaiposFinancialTransaction"("idStore");

-- CreateIndex
CREATE INDEX "SaiposFinancialTransaction_date_idx" ON "SaiposFinancialTransaction"("date");

-- CreateIndex
CREATE INDEX "SaiposFinancialTransaction_paymentDate_idx" ON "SaiposFinancialTransaction"("paymentDate");

-- CreateIndex
CREATE INDEX "SaiposFinancialTransaction_paid_idx" ON "SaiposFinancialTransaction"("paid");

-- CreateIndex
CREATE INDEX "SaiposFinancialTransaction_financialCategoryDescription_idx" ON "SaiposFinancialTransaction"("financialCategoryDescription");

-- CreateIndex
CREATE UNIQUE INDEX "SaiposFinancialTransaction_idStore_idStoreFinTransaction_key" ON "SaiposFinancialTransaction"("idStore", "idStoreFinTransaction");

-- CreateIndex
CREATE UNIQUE INDEX "Franchise_document_key" ON "Franchise"("document");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessProfile_userId_key" ON "BusinessProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessProfile_document_key" ON "BusinessProfile"("document");

-- CreateIndex
CREATE INDEX "BusinessProfile_document_idx" ON "BusinessProfile"("document");

-- CreateIndex
CREATE INDEX "Address_franchiseId_idx" ON "Address"("franchiseId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE INDEX "Product_active_featured_idx" ON "Product"("active", "featured");

-- CreateIndex
CREATE INDEX "Product_audience_active_featured_idx" ON "Product"("audience", "active", "featured");

-- CreateIndex
CREATE UNIQUE INDEX "Combo_slug_key" ON "Combo"("slug");

-- CreateIndex
CREATE INDEX "Combo_audience_active_idx" ON "Combo"("audience", "active");

-- CreateIndex
CREATE INDEX "MarketplaceCartItem_userId_updatedAt_idx" ON "MarketplaceCartItem"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "MarketplaceCartItem_productId_idx" ON "MarketplaceCartItem"("productId");

-- CreateIndex
CREATE INDEX "MarketplaceCartItem_comboId_idx" ON "MarketplaceCartItem"("comboId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceCartItem_userId_itemKey_key" ON "MarketplaceCartItem"("userId", "itemKey");

-- CreateIndex
CREATE INDEX "ComboItem_productId_idx" ON "ComboItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ComboItem_comboId_productId_key" ON "ComboItem"("comboId", "productId");

-- CreateIndex
CREATE INDEX "Promotion_active_startsAt_endsAt_idx" ON "Promotion"("active", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "Promotion_productId_idx" ON "Promotion"("productId");

-- CreateIndex
CREATE INDEX "Promotion_categoryId_idx" ON "Promotion"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

-- CreateIndex
CREATE INDEX "Coupon_active_startsAt_endsAt_idx" ON "Coupon"("active", "startsAt", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "Order_number_key" ON "Order"("number");

-- CreateIndex
CREATE INDEX "Order_franchiseId_createdAt_idx" ON "Order"("franchiseId", "createdAt");

-- CreateIndex
CREATE INDEX "Order_userId_createdAt_idx" ON "Order"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");

-- CreateIndex
CREATE INDEX "OrderItem_comboId_idx" ON "OrderItem"("comboId");

-- CreateIndex
CREATE INDEX "OrderStatusHistory_orderId_createdAt_idx" ON "OrderStatusHistory"("orderId", "createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_franchiseId_fkey" FOREIGN KEY ("franchiseId") REFERENCES "Franchise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetCode" ADD CONSTRAINT "PasswordResetCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndicatorAnalysis" ADD CONSTRAINT "IndicatorAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaiposSalePayment" ADD CONSTRAINT "SaiposSalePayment_idStore_idSale_fkey" FOREIGN KEY ("idStore", "idSale") REFERENCES "SaiposSale"("idStore", "idSale") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaiposSaleItem" ADD CONSTRAINT "SaiposSaleItem_idStore_idSale_fkey" FOREIGN KEY ("idStore", "idSale") REFERENCES "SaiposSale"("idStore", "idSale") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaiposSaleStatusHistory" ADD CONSTRAINT "SaiposSaleStatusHistory_idStore_idSale_fkey" FOREIGN KEY ("idStore", "idSale") REFERENCES "SaiposSale"("idStore", "idSale") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessProfile" ADD CONSTRAINT "BusinessProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_franchiseId_fkey" FOREIGN KEY ("franchiseId") REFERENCES "Franchise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceCartItem" ADD CONSTRAINT "MarketplaceCartItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceCartItem" ADD CONSTRAINT "MarketplaceCartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceCartItem" ADD CONSTRAINT "MarketplaceCartItem_comboId_fkey" FOREIGN KEY ("comboId") REFERENCES "Combo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComboItem" ADD CONSTRAINT "ComboItem_comboId_fkey" FOREIGN KEY ("comboId") REFERENCES "Combo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComboItem" ADD CONSTRAINT "ComboItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_franchiseId_fkey" FOREIGN KEY ("franchiseId") REFERENCES "Franchise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_comboId_fkey" FOREIGN KEY ("comboId") REFERENCES "Combo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

