import express from "express";
import cors, { type CorsOptions } from "cors";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { partnerRouter } from "./modules/partners/partner.routes";
import { hotelRouter } from "./modules/hotels/hotel.routes";
import {
  bookingRouter,
  commissionRouter,
  configRouter,
} from "./modules/bookings/booking.routes";
import { adminRouter } from "./modules/admin/admin.routes";

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin || env.isOriginAllowed(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

export function createApp() {
  const app = express();

  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions));
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
