import { Decimal } from "@prisma/client/runtime/library";

export interface RevenueBreakdown {
  bookingAmount: Decimal;
  /** Travacot net revenue on the booking */
  travacotRevenue: Decimal;
  /** Transaction fee amount subtracted from travacot net */
  transactionFee: Decimal;
  /** Travacot net revenue after transaction fee */
  ownerNetRevenue: Decimal;
  /** NIR pool: (travacot net − transaction fee) ÷ 2 */
  nirPool: Decimal;
}

export interface CommissionConfig {
  travacotPercentage: Decimal;
  transactionFeePercentage: Decimal;
  slot1CommissionPercentage: Decimal;
  slot2CommissionPercentage: Decimal;
  slot3CommissionPercentage: Decimal;
}

/**
 * NIR revenue chain (new-doc §2):
 *   Travacot Net = booking × travacot %
 *   Transaction Fee = booking × transaction fee % (subtracted from travacot net)
 *   NIR Pool = (Travacot Net − Transaction Fee) ÷ 2
 */
export function calculateRevenue(
  bookingAmount: Decimal,
  config: Pick<
    CommissionConfig,
    "travacotPercentage" | "transactionFeePercentage"
  >
): RevenueBreakdown {
  const amount = bookingAmount.toNumber();

  const travacotRevenue = new Decimal(
    (amount * config.travacotPercentage.toNumber()) / 100
  );
  const transactionFee = new Decimal(
    (amount * config.transactionFeePercentage.toNumber()) / 100
  );
  const ownerNetRevenue = travacotRevenue.minus(transactionFee);
  const nirPool = ownerNetRevenue.div(2);

  return {
    bookingAmount,
    travacotRevenue,
    transactionFee,
    ownerNetRevenue,
    nirPool,
  };
}

/** Socket earnings are always a percentage of the NIR pool. */
export function getNirPoolAmount(revenue: RevenueBreakdown): Decimal {
  return revenue.nirPool;
}

export function calculateSocketEarning(
  nirPool: Decimal,
  socketRate: Decimal
): Decimal {
  return nirPool.mul(socketRate).div(100);
}

export function getSocketRate(
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

/** @deprecated Use getSocketRate */
export const getSlotCommissionRate = getSocketRate;

/** @deprecated Use calculateSocketEarning */
export const calculatePartnerCommission = calculateSocketEarning;

/** @deprecated Use getNirPoolAmount */
export function getCommissionBaseAmount(revenue: RevenueBreakdown): Decimal {
  return getNirPoolAmount(revenue);
}
