import { Decimal } from "@prisma/client/runtime/library";
import { CommissionBase } from "@prisma/client";

export interface RevenueBreakdown {
  bookingAmount: Decimal;
  travacotRevenue: Decimal;
  transactionFee: Decimal;
  ownerNetRevenue: Decimal;
  safetyNet: Decimal;
}

export interface CommissionConfig {
  travacotPercentage: Decimal;
  transactionFeePercentage: Decimal;
  safetyNetPercentage: Decimal;
  slot1CommissionPercentage: Decimal;
  slot2CommissionPercentage: Decimal;
  slot3CommissionPercentage: Decimal;
  commissionBase: CommissionBase;
}

export function calculateRevenue(
  bookingAmount: Decimal,
  config: CommissionConfig
): RevenueBreakdown {
  const amount = bookingAmount.toNumber();

  const travacotRevenue = new Decimal(
    (amount * config.travacotPercentage.toNumber()) / 100
  );
  const transactionFee = new Decimal(
    (amount * config.transactionFeePercentage.toNumber()) / 100
  );
  const ownerNetRevenue = travacotRevenue.minus(transactionFee);
  const safetyNet = ownerNetRevenue.mul(config.safetyNetPercentage).div(100);

  return {
    bookingAmount,
    travacotRevenue,
    transactionFee,
    ownerNetRevenue,
    safetyNet,
  };
}

export function getCommissionBaseAmount(
  revenue: RevenueBreakdown,
  commissionBase: CommissionBase
): Decimal {
  switch (commissionBase) {
    case CommissionBase.TRAVACOT_REVENUE:
      return revenue.travacotRevenue;
    case CommissionBase.OWNER_NET_REVENUE:
      return revenue.ownerNetRevenue;
    case CommissionBase.SAFETY_NET:
    default:
      return revenue.safetyNet;
  }
}

export function calculatePartnerCommission(
  baseAmount: Decimal,
  commissionRate: Decimal
): Decimal {
  return baseAmount.mul(commissionRate).div(100);
}

export function getSlotCommissionRate(
  config: Pick<
    CommissionConfig,
    | "slot1CommissionPercentage"
    | "slot2CommissionPercentage"
    | "slot3CommissionPercentage"
  >,
  slotNumber: number
): Decimal {
  switch (slotNumber) {
    case 1:
      return config.slot1CommissionPercentage;
    case 2:
      return config.slot2CommissionPercentage;
    case 3:
      return config.slot3CommissionPercentage;
    default:
      throw new Error(`Invalid slot number: ${slotNumber}`);
  }
}
