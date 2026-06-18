import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import {
  createPartnerSchema,
  updatePartnerSchema,
} from "../shared/dto";

export const partnerRouter = Router();

function serializePartner(p: {
  id: string;
  name: string;
  commissionRate: { toNumber?: () => number } | number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...p,
    commissionRate:
      typeof p.commissionRate === "object" && "toNumber" in p.commissionRate
        ? parseFloat(String(p.commissionRate))
        : Number(p.commissionRate),
  };
}

partnerRouter.get("/", async (_req, res, next) => {
  try {
    const partners = await prisma.partner.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(partners.map(serializePartner));
  } catch (e) {
    next(e);
  }
});

partnerRouter.post("/", async (req, res, next) => {
  try {
    const data = createPartnerSchema.parse(req.body);
    const partner = await prisma.partner.create({
      data: {
        name: data.name,
        commissionRate: data.commissionRate,
        status: data.status ?? "ACTIVE",
      },
    });
    await prisma.partnerWallet.create({ data: { partnerId: partner.id } });
    res.status(201).json(serializePartner(partner));
  } catch (e) {
    next(e);
  }
});

partnerRouter.put("/:id", async (req, res, next) => {
  try {
    const data = updatePartnerSchema.parse(req.body);
    const partner = await prisma.partner.update({
      where: { id: req.params.id },
      data,
    });
    res.json(serializePartner(partner));
  } catch (e) {
    next(e);
  }
});

partnerRouter.delete("/:id", async (req, res, next) => {
  try {
    const partnerId = req.params.id;

    const hotels = await prisma.hotel.count({
      where: { partnerId },
    });
    if (hotels > 0) {
      throw new AppError(400, "Cannot delete partner with mapped hotels");
    }

    // Delete dependent records first to satisfy FK constraints
    await prisma.$transaction(async (tx) => {
      await tx.bookingPartnerCommission.deleteMany({
        where: { partnerId },
      });
      await tx.customerPartnerSlot.deleteMany({
        where: { partnerId },
      });
      await tx.partnerWalletTransaction.deleteMany({
        where: { partnerId },
      });
      await tx.partnerWallet.deleteMany({
        where: { partnerId },
      });

      await tx.partner.delete({ where: { id: partnerId } });
    });

    res.status(204).send();
  } catch (e) {
    next(e);
  }
});
