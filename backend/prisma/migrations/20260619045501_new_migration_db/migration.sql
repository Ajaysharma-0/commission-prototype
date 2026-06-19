-- DropForeignKey
ALTER TABLE "hotels" DROP CONSTRAINT "hotels_partner_id_fkey";

-- AddForeignKey
ALTER TABLE "hotels" ADD CONSTRAINT "hotels_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;
