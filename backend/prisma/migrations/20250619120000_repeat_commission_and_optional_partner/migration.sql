-- Optional hotel partner + repeat-booking commission history
ALTER TABLE "hotels" ALTER COLUMN "partner_id" DROP NOT NULL;

CREATE TABLE "partner_commission_history" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "partner_id" TEXT NOT NULL,
    "first_booking_id" TEXT NOT NULL,
    "rewarded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partner_commission_history_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "partner_commission_history_customer_id_partner_id_key" ON "partner_commission_history"("customer_id", "partner_id");

ALTER TABLE "partner_commission_history" ADD CONSTRAINT "partner_commission_history_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "partner_commission_history" ADD CONSTRAINT "partner_commission_history_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "partner_commission_history" ADD CONSTRAINT "partner_commission_history_first_booking_id_fkey" FOREIGN KEY ("first_booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
