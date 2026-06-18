import dotenv from "dotenv";

dotenv.config();

function parseCorsOrigins(): string[] {
  const raw = process.env.CORS_ALLOWED_ORIGINS?.trim();
  if (!raw) {
    return ["http://localhost:3000", "https://*.vercel.app"];
  }
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

function isOriginAllowed(origin: string, allowed: string[]): boolean {
  return allowed.some((pattern) => {
    if (pattern === "*") return true;
    if (pattern.includes("*")) {
      const regex = new RegExp(
        `^${pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")}$`
      );
      return regex.test(origin);
    }
    return pattern === origin;
  });
}

const corsAllowedOrigins = parseCorsOrigins();

export const env = {
  port: parseInt(process.env.PORT ?? "4000", 10),
  databaseUrl: process.env.DATABASE_URL ?? "",
  corsAllowedOrigins,
  isOriginAllowed: (origin: string) => isOriginAllowed(origin, corsAllowedOrigins),
};
