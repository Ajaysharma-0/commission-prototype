import { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

type Tx = Prisma.TransactionClient;

/**
 * Section 18 — repeat commission is tracked at customer + affiliated partner level
 * (any hotel mapped to that partner), not per individual hotel.
 */
export async function isAffiliatedPartnerAlreadyRewarded(
  tx: Tx,
  customerId: string,
  affiliatedPartnerId: string,
  currentBookingId: string
): Promise<boolean> {
  const rewardHistory = await tx.partnerCommissionHistory.findUnique({
    where: {
      customerId_partnerId: {
        customerId,
        partnerId: affiliatedPartnerId,
      },
    },
  });
  if (rewardHistory) {
    return true;
  }

  const priorAffiliatedCommission = await tx.bookingPartnerCommission.findFirst({
    where: {
      customerId,
      partnerId: affiliatedPartnerId,
      commissionAmount: { gt: new Decimal(0) },
      booking: {
        id: { not: currentBookingId },
        hotel: { partnerId: affiliatedPartnerId },
      },
    },
  });

  return Boolean(priorAffiliatedCommission);
}

export async function recordAffiliatedPartnerReward(
  tx: Tx,
  customerId: string,
  affiliatedPartnerId: string,
  bookingId: string
): Promise<void> {
  await tx.partnerCommissionHistory.upsert({
    where: {
      customerId_partnerId: {
        customerId,
        partnerId: affiliatedPartnerId,
      },
    },
    create: {
      customerId,
      partnerId: affiliatedPartnerId,
      firstBookingId: bookingId,
    },
    update: {},
  });
}
