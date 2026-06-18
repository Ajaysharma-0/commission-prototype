import { Router } from "express";
import { prisma } from "../../lib/prisma";

export const adminRouter = Router();

/**
 * Local testing helper: clears all records (and optionally re-seeds demo data).
 * NOTE: No auth is implemented in this prototype; keep it for local/dev only.
 */
adminRouter.post("/reset", async (req, res, next) => {
  try {
    const reseed = Boolean(req.body?.reseed);

    await prisma.$transaction(async (tx) => {
      // Child tables first
      await tx.partnerWalletTransaction.deleteMany();
      await tx.bookingPartnerCommission.deleteMany();
      await tx.bookingRevenue.deleteMany();
      await tx.customerPartnerSlot.deleteMany();

      // Parent tables
      await tx.booking.deleteMany();
      await tx.customer.deleteMany();
      await tx.hotel.deleteMany();
      await tx.partnerWallet.deleteMany();
      await tx.partner.deleteMany();
      await tx.commissionConfiguration.deleteMany();

      if (!reseed) return;

      // Minimal demo seed (same defaults as prisma/seed.ts)
      await tx.commissionConfiguration.create({
        data: {
          travacotPercentage: 15,
          transactionFeePercentage: 4,
          safetyNetPercentage: 50,
          commissionBase: "SAFETY_NET",
          active: true,
        },
      });

      const partnerA = await tx.partner.create({
        data: { name: "Partner A", commissionRate: 20, status: "ACTIVE" },
      });
      const partnerB = await tx.partner.create({
        data: { name: "Partner B", commissionRate: 15, status: "ACTIVE" },
      });
      const partnerC = await tx.partner.create({
        data: { name: "Partner C", commissionRate: 10, status: "ACTIVE" },
      });
      const partnerD = await tx.partner.create({
        data: { name: "Partner D", commissionRate: 12, status: "ACTIVE" },
      });

      for (const p of [partnerA, partnerB, partnerC, partnerD]) {
        await tx.partnerWallet.create({ data: { partnerId: p.id } });
      }

      await tx.hotel.createMany({
        data: [
          { name: "Grand Palace Hotel", price: 75, partnerId: partnerA.id },
          { name: "Sunset Resort", price: 120, partnerId: partnerB.id },
          { name: "Mountain View Lodge", price: 95, partnerId: partnerC.id },
          { name: "City Center Inn", price: 60, partnerId: partnerD.id },
        ],
      });
    });

    res.json({ ok: true, reseeded: reseed });
  } catch (e) {
    next(e);
  }
});

