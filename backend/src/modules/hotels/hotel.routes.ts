import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import { createHotelSchema, updateHotelSchema } from "../shared/dto";

export const hotelRouter = Router();

function serializeHotel(h: {
  id: string;
  name: string;
  price: { toString: () => string } | number;
  partnerId: string;
  status: string;
  partner?: { id: string; name: string };
  createdAt?: Date;
  updatedAt?: Date;
}) {
  return {
    id: h.id,
    name: h.name,
    price: parseFloat(String(h.price)),
    partnerId: h.partnerId,
    status: h.status,
    partner: h.partner
      ? {
          id: h.partner.id,
          name: h.partner.name,
        }
      : undefined,
    createdAt: h.createdAt,
    updatedAt: h.updatedAt,
  };
}

hotelRouter.get("/", async (_req, res, next) => {
  try {
    const hotels = await prisma.hotel.findMany({
      include: { partner: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(hotels.map(serializeHotel));
  } catch (e) {
    next(e);
  }
});

hotelRouter.post("/", async (req, res, next) => {
  try {
    const data = createHotelSchema.parse(req.body);
    const hotel = await prisma.hotel.create({
      data: {
        name: data.name,
        price: data.price,
        partnerId: data.partnerId,
        status: data.status ?? "ACTIVE",
      },
      include: { partner: true },
    });
    res.status(201).json(serializeHotel(hotel));
  } catch (e) {
    next(e);
  }
});

hotelRouter.put("/:id", async (req, res, next) => {
  try {
    const data = updateHotelSchema.parse(req.body);
    const hotel = await prisma.hotel.update({
      where: { id: req.params.id },
      data,
      include: { partner: true },
    });
    res.json(serializeHotel(hotel));
  } catch (e) {
    next(e);
  }
});

hotelRouter.delete("/:id", async (req, res, next) => {
  try {
    const bookingCount = await prisma.booking.count({
      where: { hotelId: req.params.id },
    });

    if (bookingCount > 0) {
      throw new AppError(
        400,
        `Cannot delete hotel: ${bookingCount} booking(s) exist for this hotel. Deactivate it instead or remove bookings first.`
      );
    }

    await prisma.hotel.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});
