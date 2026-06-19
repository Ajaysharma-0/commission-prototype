import { z } from "zod";

export const createPartnerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const updatePartnerSchema = createPartnerSchema.partial();

export const createHotelSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.number().positive("Price must be positive"),
  partnerId: z.string().uuid("Invalid partner ID").nullish(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const updateHotelSchema = createHotelSchema.partial();

export const updateConfigSchema = z.object({
  travacotPercentage: z.number().min(0).max(100).optional(),
  transactionFeePercentage: z.number().min(0).max(100).optional(),
  safetyNetPercentage: z.number().min(0).max(100).optional(),
  slot1CommissionPercentage: z.number().min(0).max(100).optional(),
  slot2CommissionPercentage: z.number().min(0).max(100).optional(),
  slot3CommissionPercentage: z.number().min(0).max(100).optional(),
  commissionBase: z
    .enum(["SAFETY_NET", "OWNER_NET_REVENUE", "TRAVACOT_REVENUE"])
    .optional(),
});

export const createBookingSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  hotelId: z.string().uuid("Invalid hotel ID"),
});
