import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2003") {
      return res.status(400).json({
        error: "Cannot delete: this record is linked to other data (e.g. bookings).",
      });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Record not found." });
    }
    console.error("[Prisma]", err.code, err.message);
    return res.status(500).json({
      error:
        process.env.NODE_ENV === "production"
          ? "Database error"
          : `Database error (${err.code}): ${err.message}`,
    });
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    console.error("[Prisma validation]", err.message);
    return res.status(500).json({
      error:
        process.env.NODE_ENV === "production"
          ? "Database schema mismatch — run prisma migrate deploy"
          : err.message,
    });
  }

  console.error("[Error]", err);
  return res.status(500).json({ error: "Internal server error" });
}
