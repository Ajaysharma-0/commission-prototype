-- CreateEnum
CREATE TYPE "PartnerStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "HotelStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "CommissionBase" AS ENUM ('SAFETY_NET', 'OWNER_NET_REVENUE', 'TRAVACOT_REVENUE');

-- CreateEnum
CREATE TYPE "WalletTransactionType" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('PENDING', 'PAID');

-- CreateTable
CREATE TABLE "partners" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "commission_rate" DECIMAL(5,2) NOT NULL,
    "status" "PartnerStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotels" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "partner_id" TEXT NOT NULL,
    "status" "HotelStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hotels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "hotel_id" TEXT NOT NULL,
    "booking_amount" DECIMAL(10,2) NOT NULL,
    "booking_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_configuration" (
    "id" TEXT NOT NULL,
    "travacot_percentage" DECIMAL(5,2) NOT NULL,
    "transaction_fee_percentage" DECIMAL(5,2) NOT NULL,
    "safety_net_percentage" DECIMAL(5,2) NOT NULL,
    "commission_base" "CommissionBase" NOT NULL DEFAULT 'SAFETY_NET',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commission_configuration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_partner_slots" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "slot_number" INTEGER NOT NULL,
    "partner_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_partner_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_revenue" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "booking_amount" DECIMAL(10,2) NOT NULL,
    "travacot_revenue" DECIMAL(10,2) NOT NULL,
    "transaction_fee" DECIMAL(10,2) NOT NULL,
    "owner_net_revenue" DECIMAL(10,2) NOT NULL,
    "safety_net" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "booking_revenue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_partner_commissions" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "partner_id" TEXT NOT NULL,
    "slot_number" INTEGER NOT NULL,
    "commission_rate" DECIMAL(5,2) NOT NULL,
    "commission_amount" DECIMAL(10,2) NOT NULL,
    "status" "CommissionStatus" NOT NULL DEFAULT 'PAID',

    CONSTRAINT "booking_partner_commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_wallet" (
    "id" TEXT NOT NULL,
    "partner_id" TEXT NOT NULL,
    "total_credit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_debit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "available_balance" DECIMAL(12,2) NOT NULL DEFAULT 0,

    CONSTRAINT "partner_wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_wallet_transactions" (
    "id" TEXT NOT NULL,
    "partner_id" TEXT NOT NULL,
    "booking_id" TEXT,
    "transaction_type" "WalletTransactionType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partner_wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customer_partner_slots_customer_id_slot_number_key" ON "customer_partner_slots"("customer_id", "slot_number");

-- CreateIndex
CREATE UNIQUE INDEX "customer_partner_slots_customer_id_partner_id_key" ON "customer_partner_slots"("customer_id", "partner_id");

-- CreateIndex
CREATE UNIQUE INDEX "booking_revenue_booking_id_key" ON "booking_revenue"("booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "partner_wallet_partner_id_key" ON "partner_wallet"("partner_id");

-- AddForeignKey
ALTER TABLE "hotels" ADD CONSTRAINT "hotels_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_partner_slots" ADD CONSTRAINT "customer_partner_slots_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_partner_slots" ADD CONSTRAINT "customer_partner_slots_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_revenue" ADD CONSTRAINT "booking_revenue_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_partner_commissions" ADD CONSTRAINT "booking_partner_commissions_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_partner_commissions" ADD CONSTRAINT "booking_partner_commissions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_partner_commissions" ADD CONSTRAINT "booking_partner_commissions_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_wallet" ADD CONSTRAINT "partner_wallet_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_wallet_transactions" ADD CONSTRAINT "partner_wallet_transactions_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_wallet_transactions" ADD CONSTRAINT "partner_wallet_transactions_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
