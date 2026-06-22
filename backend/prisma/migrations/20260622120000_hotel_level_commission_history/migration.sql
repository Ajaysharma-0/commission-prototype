-- Repeat commission: track per customer + hotel (not per customer + partner)
ALTER TABLE "partner_commission_history" ADD COLUMN "hotel_id" TEXT;

UPDATE "partner_commission_history" pch
SET "hotel_id" = b."hotel_id"
FROM "bookings" b
WHERE pch."first_booking_id" = b."id";

ALTER TABLE "partner_commission_history" ALTER COLUMN "hotel_id" SET NOT NULL;

DROP INDEX "partner_commission_history_customer_id_partner_id_key";

CREATE UNIQUE INDEX "partner_commission_history_customer_id_hotel_id_key"
  ON "partner_commission_history"("customer_id", "hotel_id");

ALTER TABLE "partner_commission_history"
  ADD CONSTRAINT "partner_commission_history_hotel_id_fkey"
  FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
