-- NIR socket rate defaults (Socket A 7.5%, B 5%, C 2.5%)
ALTER TABLE "commission_configuration"
  ALTER COLUMN "slot1_commission_percentage" SET DEFAULT 7.5,
  ALTER COLUMN "slot2_commission_percentage" SET DEFAULT 5,
  ALTER COLUMN "slot3_commission_percentage" SET DEFAULT 2.5;

UPDATE "commission_configuration"
SET
  "slot1_commission_percentage" = 7.5,
  "slot2_commission_percentage" = 5,
  "slot3_commission_percentage" = 2.5
WHERE
  "slot1_commission_percentage" = 20
  AND "slot2_commission_percentage" = 15
  AND "slot3_commission_percentage" = 10;
