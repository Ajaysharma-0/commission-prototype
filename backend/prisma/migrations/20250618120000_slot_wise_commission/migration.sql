-- Slot-wise commission: rates on config, not per partner
ALTER TABLE "commission_configuration"
  ADD COLUMN "slot1_commission_percentage" DECIMAL(5,2) NOT NULL DEFAULT 20,
  ADD COLUMN "slot2_commission_percentage" DECIMAL(5,2) NOT NULL DEFAULT 15,
  ADD COLUMN "slot3_commission_percentage" DECIMAL(5,2) NOT NULL DEFAULT 10;

ALTER TABLE "partners" DROP COLUMN "commission_rate";
