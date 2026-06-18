import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.commissionConfiguration.create({
    data: {
      travacotPercentage: 15,
      transactionFeePercentage: 4,
      safetyNetPercentage: 50,
      commissionBase: "SAFETY_NET",
      active: true,
    },
  });

  const partnerA = await prisma.partner.create({
    data: { name: "Partner A", commissionRate: 20, status: "ACTIVE" },
  });
  const partnerB = await prisma.partner.create({
    data: { name: "Partner B", commissionRate: 15, status: "ACTIVE" },
  });
  const partnerC = await prisma.partner.create({
    data: { name: "Partner C", commissionRate: 10, status: "ACTIVE" },
  });
  const partnerD = await prisma.partner.create({
    data: { name: "Partner D", commissionRate: 12, status: "ACTIVE" },
  });

  for (const p of [partnerA, partnerB, partnerC, partnerD]) {
    await prisma.partnerWallet.create({ data: { partnerId: p.id } });
  }

  await prisma.hotel.createMany({
    data: [
      { name: "Grand Palace Hotel", price: 75, partnerId: partnerA.id },
      { name: "Sunset Resort", price: 120, partnerId: partnerB.id },
      { name: "Mountain View Lodge", price: 95, partnerId: partnerC.id },
      { name: "City Center Inn", price: 60, partnerId: partnerD.id },
    ],
  });

  console.log("Seed completed successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
