import express, { type Request, type Response, type NextFunction } from "express";
import { errorHandler } from "./middleware/errorHandler";
import { partnerRouter } from "./modules/partners/partner.routes";
import { hotelRouter } from "./modules/hotels/hotel.routes";
import {
  bookingRouter,
  commissionRouter,
  configRouter,
} from "./modules/bookings/booking.routes";
import { adminRouter } from "./modules/admin/admin.routes";

function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;

  // Prototype: echo the request origin so all Vercel preview/production URLs work.
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  next();
}

export function createApp() {
  const app = express();

  app.use(corsMiddleware);
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "commission-engine" });
  });

  app.use("/api/partners", partnerRouter);
  app.use("/api/hotels", hotelRouter);
  app.use("/api/bookings", bookingRouter);
  app.use("/api/commission", commissionRouter);
  app.use("/api/config", configRouter);
  app.use("/api/admin", adminRouter);

  app.use(errorHandler);

  return app;
}
