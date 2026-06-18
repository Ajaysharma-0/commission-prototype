import {
  CommissionBase,
  WalletTransactionType,
} from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import {
  calculatePartnerCommission,
  calculateRevenue,
  getCommissionBaseAmount,
} from "./commission.calculator";

export type ProductType = "HOTEL" | "FLIGHT" | "PACKAGE" | "ACTIVITY" | "VISA" | "INSURANCE";

export interface ProcessBookingInput {
  bookingId?: string;
  customerId: string;
  partnerId: string;
  hotelId: string;
  bookingAmount: number;
  productType?: ProductType;
}

export interface ProcessBookingResult {
  bookingId: string;
  revenue: {
    bookingAmount: number;
    travacotRevenue: number;
    transactionFee: number;
    ownerNetRevenue: number;
    safetyNet: number;
  };
  slotAssignment: {
    assigned: boolean;
    slotNumber?: number;
    partnerId: string;
    partnerName: string;
  };
  customerSlots: Array<{
    slotNumber: number;
    partnerId: string;
    partnerName: string;
    commissionRate: number;
    commissionAmount: number;
  }>;
  partnerCommissions: Array<{
    partnerId: string;
    partnerName: string;
    slotNumber: number;
    commissionRate: number;
    commissionAmount: number;
  }>;
}

function toNumber(d: Decimal): number {
  return parseFloat(d.toFixed(2));
}

/**
 * Standalone Commission Engine — reusable across booking products.
 * All revenue and commission logic lives here; booking module only creates records.
 */
export class CommissionEngine {
  static async processBooking(
    input: ProcessBookingInput
  ): Promise<ProcessBookingResult> {
    const config = await prisma.commissionConfiguration.findFirst({
      where: { active: true },
      orderBy: { createdAt: "desc" },
    });

    if (!config) {
      throw new AppError(400, "No active commission configuration found");
    }

    const hotel = await prisma.hotel.findUnique({
      where: { id: input.hotelId },
      include: { partner: true },
    });

    if (!hotel) {
      throw new AppError(404, "Hotel not found");
    }

    const customer = await prisma.customer.findUnique({
      where: { id: input.customerId },
    });

    if (!customer) {
      throw new AppError(404, "Customer not found");
    }

    const bookingAmount = new Decimal(input.bookingAmount);
    const revenue = calculateRevenue(bookingAmount, config);
    const commissionBase = getCommissionBaseAmount(revenue, config.commissionBase);

    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.create({
        data: {
          customerId: input.customerId,
          hotelId: input.hotelId,
          bookingAmount,
        },
      });

      await tx.bookingRevenue.create({
        data: {
          bookingId: booking.id,
          bookingAmount: revenue.bookingAmount,
          travacotRevenue: revenue.travacotRevenue,
          transactionFee: revenue.transactionFee,
          ownerNetRevenue: revenue.ownerNetRevenue,
          safetyNet: revenue.safetyNet,
        },
      });

      const existingSlots = await tx.customerPartnerSlot.findMany({
        where: { customerId: input.customerId },
        include: { partner: true },
        orderBy: { slotNumber: "asc" },
      });

      const hotelPartnerId = hotel.partnerId;
      const alreadySlotted = existingSlots.some(
        (s) => s.partnerId === hotelPartnerId
      );

      let slotAssignment: ProcessBookingResult["slotAssignment"] = {
        assigned: false,
        partnerId: hotel.partnerId,
        partnerName: hotel.partner.name,
      };

      if (!alreadySlotted && existingSlots.length < 3) {
        const nextSlot = existingSlots.length + 1;
        await tx.customerPartnerSlot.create({
          data: {
            customerId: input.customerId,
            slotNumber: nextSlot,
            partnerId: hotelPartnerId,
          },
        });
        slotAssignment = {
          assigned: true,
          slotNumber: nextSlot,
          partnerId: hotel.partnerId,
          partnerName: hotel.partner.name,
        };
      }

      const allSlots = await tx.customerPartnerSlot.findMany({
        where: { customerId: input.customerId },
        include: { partner: true },
        orderBy: { slotNumber: "asc" },
      });

      const partnerCommissions: ProcessBookingResult["partnerCommissions"] = [];

      for (const slot of allSlots) {
        const amount = calculatePartnerCommission(
          commissionBase,
          slot.partner.commissionRate
        );

        await tx.bookingPartnerCommission.create({
          data: {
            bookingId: booking.id,
            customerId: input.customerId,
            partnerId: slot.partnerId,
            slotNumber: slot.slotNumber,
            commissionRate: slot.partner.commissionRate,
            commissionAmount: amount,
          },
        });

        let wallet = await tx.partnerWallet.findUnique({
          where: { partnerId: slot.partnerId },
        });

        if (!wallet) {
          wallet = await tx.partnerWallet.create({
            data: { partnerId: slot.partnerId },
          });
        }

        await tx.partnerWallet.update({
          where: { partnerId: slot.partnerId },
          data: {
            totalCredit: wallet.totalCredit.plus(amount),
            availableBalance: wallet.availableBalance.plus(amount),
          },
        });

        await tx.partnerWalletTransaction.create({
          data: {
            partnerId: slot.partnerId,
            bookingId: booking.id,
            transactionType: WalletTransactionType.CREDIT,
            amount,
            remarks: `Commission for booking ${booking.id} (Slot ${slot.slotNumber})`,
          },
        });

        partnerCommissions.push({
          partnerId: slot.partnerId,
          partnerName: slot.partner.name,
          slotNumber: slot.slotNumber,
          commissionRate: toNumber(slot.partner.commissionRate),
          commissionAmount: toNumber(amount),
        });
      }

      return {
        bookingId: booking.id,
        slotAssignment,
        allSlots,
        partnerCommissions,
      };
    });

    const customerSlots = result.allSlots.map((slot) => {
      const commission = result.partnerCommissions.find(
        (c) => c.slotNumber === slot.slotNumber
      );
      return {
        slotNumber: slot.slotNumber,
        partnerId: slot.partnerId,
        partnerName: slot.partner.name,
        commissionRate: toNumber(slot.partner.commissionRate),
        commissionAmount: commission?.commissionAmount ?? 0,
      };
    });

    return {
      bookingId: result.bookingId,
      revenue: {
        bookingAmount: toNumber(revenue.bookingAmount),
        travacotRevenue: toNumber(revenue.travacotRevenue),
        transactionFee: toNumber(revenue.transactionFee),
        ownerNetRevenue: toNumber(revenue.ownerNetRevenue),
        safetyNet: toNumber(revenue.safetyNet),
      },
      slotAssignment: result.slotAssignment,
      customerSlots,
      partnerCommissions: result.partnerCommissions,
    };
  }

  static async getCustomerSlots(customerId: string) {
    const slots = await prisma.customerPartnerSlot.findMany({
      where: { customerId },
      include: { partner: true },
      orderBy: { slotNumber: "asc" },
    });

    return slots.map((s) => ({
      slotNumber: s.slotNumber,
      partnerId: s.partnerId,
      partnerName: s.partner.name,
      commissionRate: toNumber(s.partner.commissionRate),
      assignedAt: s.assignedAt,
    }));
  }

  static async getPartnerWallet(partnerId: string) {
    const wallet = await prisma.partnerWallet.findUnique({
      where: { partnerId },
      include: {
        partner: { select: { name: true } },
      },
    });

    if (!wallet) {
      return {
        partnerId,
        partnerName: null,
        totalCredit: 0,
        totalDebit: 0,
        availableBalance: 0,
      };
    }

    const transactions = await prisma.partnerWalletTransaction.findMany({
      where: { partnerId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return {
      partnerId: wallet.partnerId,
      partnerName: wallet.partner.name,
      totalCredit: toNumber(wallet.totalCredit),
      totalDebit: toNumber(wallet.totalDebit),
      availableBalance: toNumber(wallet.availableBalance),
      transactions: transactions.map((t) => ({
        id: t.id,
        bookingId: t.bookingId,
        transactionType: t.transactionType,
        amount: toNumber(t.amount),
        remarks: t.remarks,
        createdAt: t.createdAt,
      })),
    };
  }

  static async getRevenueReport() {
    const revenues = await prisma.bookingRevenue.findMany({
      include: {
        booking: {
          include: {
            customer: true,
            hotel: true,
          },
        },
      },
      orderBy: { booking: { bookingDate: "desc" } },
    });

    const totals = revenues.reduce(
      (acc, r) => ({
        bookingAmount: acc.bookingAmount + toNumber(r.bookingAmount),
        travacotRevenue: acc.travacotRevenue + toNumber(r.travacotRevenue),
        transactionFee: acc.transactionFee + toNumber(r.transactionFee),
        ownerNetRevenue: acc.ownerNetRevenue + toNumber(r.ownerNetRevenue),
        safetyNet: acc.safetyNet + toNumber(r.safetyNet),
      }),
      {
        bookingAmount: 0,
        travacotRevenue: 0,
        transactionFee: 0,
        ownerNetRevenue: 0,
        safetyNet: 0,
      }
    );

    return { totals, count: revenues.length };
  }
}
