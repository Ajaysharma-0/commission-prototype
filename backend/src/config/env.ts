import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: parseInt(process.env.PORT ?? "4000", 10),
  databaseUrl: process.env.DATABASE_URL ?? "",
};
