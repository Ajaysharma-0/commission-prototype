import { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

type Tx = Prisma.TransactionClient;

/**
 * Repeat commission is tracked per customer + hotel.
 * The affiliated partner earns once per hotel; repeat bookings at the same
 * hotel are skipped, but a different hotel mapped to the same partner can pay again.
 */
export async function isAffiliatedPartnerAlreadyRewarded(
  tx: Tx,
  customerId: string,
  hotelId: string,
  affiliatedPartnerId: string,
  currentBookingId: string
): Promise<boolean> {
  const rewardHistory = await tx.partnerCommissionHistory.findUnique({
    where: {
      customerId_hotelId: {
        customerId,
        hotelId,
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
        hotelId,
      },
    },
  });

  return Boolean(priorAffiliatedCommission);
}

export async function recordAffiliatedPartnerReward(
  tx: Tx,
  customerId: string,
  affiliatedPartnerId: string,
  hotelId: string,
  bookingId: string
): Promise<void> {
  await tx.partnerCommissionHistory.upsert({
    where: {
      customerId_hotelId: {
        customerId,
        hotelId,
      },
    },
    create: {
      customerId,
      partnerId: affiliatedPartnerId,
      hotelId,
      firstBookingId: bookingId,
    },
    update: {},
  });
}
