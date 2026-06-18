import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { CommissionEngine } from "../commission/commission.engine";
import { getSlotCommissionRate } from "../commission/commission.calculator";
import { createBookingSchema } from "../shared/dto";
import { updateConfigSchema } from "../shared/dto";
import { AppError } from "../../middleware/errorHandler";
import { Prisma } from "@prisma/client";

export const bookingRouter = Router();
export const commissionRouter = Router();
export const configRouter = Router();

function toNum(v: unknown): number {
  return parseFloat(String(v));
}

bookingRouter.get("/history", async (_req, res, next) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        customer: true,
        hotel: { include: { partner: true } },
        revenue: true,
        partnerCommissions: {
          include: { partner: true },
          orderBy: { slotNumber: "asc" },
        },
      },
      orderBy: { bookingDate: "desc" },
    });

    res.json(
      bookings.map((b) => {
        const slotCommissions = [1, 2, 3].map((slot) => {
          const c = b.partnerCommissions.find((pc) => pc.slotNumber === slot);
          return c
            ? {
                slotNumber: slot,
                partnerName: c.partner.name,
                commissionAmount: toNum(c.commissionAmount),
              }
            : { slotNumber: slot, partnerName: null, commissionAmount: 0 };
        });

        return {
          id: b.id,
          customer: b.customer.name,
          customerId: b.customerId,
          hotel: b.hotel.name,
          partner: b.hotel.partner.name,
          bookingAmount: toNum(b.bookingAmount),
          travacotRevenue: b.revenue ? toNum(b.revenue.travacotRevenue) : 0,
          transactionFee: b.revenue ? toNum(b.revenue.transactionFee) : 0,
          ownerNetRevenue: b.revenue ? toNum(b.revenue.ownerNetRevenue) : 0,
          safetyNet: b.revenue ? toNum(b.revenue.safetyNet) : 0,
          slot1Commission: slotCommissions[0],
          slot2Commission: slotCommissions[1],
          slot3Commission: slotCommissions[2],
          bookingDate: b.bookingDate,
        };
      })
    );
  } catch (e) {
    next(e);
  }
});

bookingRouter.post("/", async (req, res, next) => {
  try {
    const data = createBookingSchema.parse(req.body);

    const hotel = await prisma.hotel.findUnique({
      where: { id: data.hotelId },
    });

    if (!hotel) {
      return res.status(404).json({ error: "Hotel not found" });
    }

    let customer = await prisma.customer.findFirst({
      where: { name: data.customerName },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: { name: data.customerName },
      });
    }

    const result = await CommissionEngine.processBooking({
      customerId: customer.id,
      partnerId: hotel.partnerId,
      hotelId: data.hotelId,
      bookingAmount: toNum(hotel.price),
      productType: "HOTEL",
    });

    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

bookingRouter.delete("/:id", async (req, res, next) => {
  try {
    const bookingId = req.params.id;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        walletTransactions: true,
        partnerCommissions: true,
      },
    });

    if (!booking) {
      throw new AppError(404, "Booking not found");
    }

    const affectedPartnerIds = Array.from(
      new Set(booking.walletTransactions.map((t) => t.partnerId))
    );

    await prisma.$transaction(async (tx) => {
      // Delete dependent rows first
      await tx.partnerWalletTransaction.deleteMany({ where: { bookingId } });
      await tx.bookingPartnerCommission.deleteMany({ where: { bookingId } });
      await tx.bookingRevenue.deleteMany({ where: { bookingId } });

      // Then the booking itself
      await tx.booking.delete({ where: { id: bookingId } });

      // Recompute wallets for affected partners based on remaining ledger
      if (affectedPartnerIds.length > 0) {
        const grouped = await tx.partnerWalletTransaction.groupBy({
          by: ["partnerId", "transactionType"],
          where: { partnerId: { in: affectedPartnerIds } },
          _sum: { amount: true },
        });

        for (const partnerId of affectedPartnerIds) {
          const credit =
            grouped.find(
              (g) => g.partnerId === partnerId && g.transactionType === "CREDIT"
            )?._sum.amount ?? 0;
          const debit =
            grouped.find(
              (g) => g.partnerId === partnerId && g.transactionType === "DEBIT"
            )?._sum.amount ?? 0;

          const creditDec = new Prisma.Decimal(credit as any);
          const debitDec = new Prisma.Decimal(debit as any);

          // Ensure wallet exists
          await tx.partnerWallet.upsert({
            where: { partnerId },
            create: { partnerId },
            update: {},
          });

          await tx.partnerWallet.update({
            where: { partnerId },
            data: {
              totalCredit: creditDec,
              totalDebit: debitDec,
              availableBalance: creditDec.minus(debitDec),
            },
          });
        }
      }
    });

    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

commissionRouter.get("/slots/:customerId", async (req, res, next) => {
  try {
    const slots = await CommissionEngine.getCustomerSlots(req.params.customerId);
    res.json(slots);
  } catch (e) {
    next(e);
  }
});

commissionRouter.get("/wallet/:partnerId", async (req, res, next) => {
  try {
    const wallet = await CommissionEngine.getPartnerWallet(req.params.partnerId);
    res.json(wallet);
  } catch (e) {
    next(e);
  }
});

commissionRouter.get("/revenue-report", async (_req, res, next) => {
  try {
    const report = await CommissionEngine.getRevenueReport();
    res.json(report);
  } catch (e) {
    next(e);
  }
});

commissionRouter.get("/wallets", async (_req, res, next) => {
  try {
    const wallets = await prisma.partnerWallet.findMany({
      include: { partner: { select: { name: true } } },
    });
    res.json(
      wallets.map((w) => ({
        partnerId: w.partnerId,
        partnerName: w.partner.name,
        totalCredit: toNum(w.totalCredit),
        totalDebit: toNum(w.totalDebit),
        availableBalance: toNum(w.availableBalance),
      }))
    );
  } catch (e) {
    next(e);
  }
});

function serializeConfig(config: {
  id: string;
  travacotPercentage: unknown;
  transactionFeePercentage: unknown;
  safetyNetPercentage: unknown;
  slot1CommissionPercentage: unknown;
  slot2CommissionPercentage: unknown;
  slot3CommissionPercentage: unknown;
  commissionBase: string;
  active: boolean;
}) {
  return {
    id: config.id,
    travacotPercentage: toNum(config.travacotPercentage),
    transactionFeePercentage: toNum(config.transactionFeePercentage),
    safetyNetPercentage: toNum(config.safetyNetPercentage),
    slot1CommissionPercentage: toNum(config.slot1CommissionPercentage),
    slot2CommissionPercentage: toNum(config.slot2CommissionPercentage),
    slot3CommissionPercentage: toNum(config.slot3CommissionPercentage),
    commissionBase: config.commissionBase,
    active: config.active,
  };
}

configRouter.get("/", async (_req, res, next) => {
  try {
    const config = await prisma.commissionConfiguration.findFirst({
      where: { active: true },
      orderBy: { createdAt: "desc" },
    });
    if (!config) {
      return res.json(null);
    }
    res.json(serializeConfig(config));
  } catch (e) {
    next(e);
  }
});

configRouter.put("/", async (req, res, next) => {
  try {
    const data = updateConfigSchema.parse(req.body);
    const existing = await prisma.commissionConfiguration.findFirst({
      where: { active: true },
    });

    let config;
    if (existing) {
      config = await prisma.commissionConfiguration.update({
        where: { id: existing.id },
        data,
      });
    } else {
      config = await prisma.commissionConfiguration.create({
        data: {
          travacotPercentage: data.travacotPercentage ?? 15,
          transactionFeePercentage: data.transactionFeePercentage ?? 4,
          safetyNetPercentage: data.safetyNetPercentage ?? 50,
          slot1CommissionPercentage: data.slot1CommissionPercentage ?? 20,
          slot2CommissionPercentage: data.slot2CommissionPercentage ?? 15,
          slot3CommissionPercentage: data.slot3CommissionPercentage ?? 10,
          commissionBase: data.commissionBase ?? "SAFETY_NET",
        },
      });
    }

    res.json(serializeConfig(config));
  } catch (e) {
    next(e);
  }
});

configRouter.get("/customers", async (_req, res, next) => {
  try {
    const config = await prisma.commissionConfiguration.findFirst({
      where: { active: true },
      orderBy: { createdAt: "desc" },
    });

    const customers = await prisma.customer.findMany({
      include: {
        partnerSlots: {
          include: { partner: true },
          orderBy: { slotNumber: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(
      customers.map((c) => ({
        id: c.id,
        name: c.name,
        slots: c.partnerSlots.map((s) => ({
          slotNumber: s.slotNumber,
          partnerId: s.partnerId,
          partnerName: s.partner.name,
          commissionRate: config
            ? toNum(getSlotCommissionRate(config, s.slotNumber))
            : 0,
        })),
      }))
    );
  } catch (e) {
    next(e);
  }
});
