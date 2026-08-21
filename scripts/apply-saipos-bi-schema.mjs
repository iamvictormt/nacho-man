#!/usr/bin/env node
import "dotenv/config"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const statements = [
  `CREATE TABLE IF NOT EXISTS "SaiposSalePayment" (
    "id" TEXT PRIMARY KEY,
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SaiposSalePayment_idStore_idSale_fkey"
      FOREIGN KEY ("idStore", "idSale")
      REFERENCES "SaiposSale"("idStore", "idSale")
      ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "SaiposSalePayment_idStore_idSale_paymentIndex_key" ON "SaiposSalePayment"("idStore", "idSale", "paymentIndex")`,
  `CREATE INDEX IF NOT EXISTS "SaiposSalePayment_idStore_idSale_idx" ON "SaiposSalePayment"("idStore", "idSale")`,
  `CREATE INDEX IF NOT EXISTS "SaiposSalePayment_paymentType_idx" ON "SaiposSalePayment"("paymentType")`,
  `CREATE INDEX IF NOT EXISTS "SaiposSalePayment_createdAtSaipos_idx" ON "SaiposSalePayment"("createdAtSaipos")`,

  `CREATE TABLE IF NOT EXISTS "SaiposSaleStatusHistory" (
    "id" TEXT PRIMARY KEY,
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SaiposSaleStatusHistory_idStore_idSale_fkey"
      FOREIGN KEY ("idStore", "idSale")
      REFERENCES "SaiposSale"("idStore", "idSale")
      ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "SaiposSaleStatusHistory_idStore_idSaleStatusHistory_key" ON "SaiposSaleStatusHistory"("idStore", "idSaleStatusHistory")`,
  `CREATE INDEX IF NOT EXISTS "SaiposSaleStatusHistory_idStore_idSale_idx" ON "SaiposSaleStatusHistory"("idStore", "idSale")`,
  `CREATE INDEX IF NOT EXISTS "SaiposSaleStatusHistory_statusDescription_idx" ON "SaiposSaleStatusHistory"("statusDescription")`,
  `CREATE INDEX IF NOT EXISTS "SaiposSaleStatusHistory_createdAtSaipos_idx" ON "SaiposSaleStatusHistory"("createdAtSaipos")`,

  `CREATE TABLE IF NOT EXISTS "SaiposFinancialTransaction" (
    "id" TEXT PRIMARY KEY,
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "SaiposFinancialTransaction_idStore_idStoreFinTransaction_key" ON "SaiposFinancialTransaction"("idStore", "idStoreFinTransaction")`,
  `CREATE INDEX IF NOT EXISTS "SaiposFinancialTransaction_idStore_idx" ON "SaiposFinancialTransaction"("idStore")`,
  `CREATE INDEX IF NOT EXISTS "SaiposFinancialTransaction_date_idx" ON "SaiposFinancialTransaction"("date")`,
  `CREATE INDEX IF NOT EXISTS "SaiposFinancialTransaction_paymentDate_idx" ON "SaiposFinancialTransaction"("paymentDate")`,
  `CREATE INDEX IF NOT EXISTS "SaiposFinancialTransaction_paid_idx" ON "SaiposFinancialTransaction"("paid")`,
  `CREATE INDEX IF NOT EXISTS "SaiposFinancialTransaction_financialCategoryDescription_idx" ON "SaiposFinancialTransaction"("financialCategoryDescription")`,
]

try {
  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement)
  }
  console.log("Saipos BI schema applied.")
} finally {
  await prisma.$disconnect()
}
