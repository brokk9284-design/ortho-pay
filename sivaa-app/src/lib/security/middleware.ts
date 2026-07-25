import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/redis";
import { logger } from "@/lib/logger";

const RATE_LIMITS: Record<string, { limit: number; windowSeconds: number }> = {
  "/api/v1/marketplace": { limit: 60, windowSeconds: 60 },
  "/api/v1/escrows": { limit: 30, windowSeconds: 60 },
  "/api/v1/disputes": { limit: 20, windowSeconds: 60 },
  "/api/v1/fees": { limit: 60, windowSeconds: 60 },
  "/api/v1/wallet": { limit: 30, windowSeconds: 60 },
  "/api/v1/auth": { limit: 10, windowSeconds: 60 },
  "/api/v1/payments": { limit: 20, windowSeconds: 60 },
};

function getRateLimitConfig(pathname: string): { limit: number; windowSeconds: number } | null {
  for (const [prefix, config] of Object.entries(RATE_LIMITS)) {
    if (pathname.startsWith(prefix)) return config;
  }
  return null;
}

function getClientIdentifier(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  return `${ip}:${req.headers.get("user-id") || "anonymous"}`;
}

export async function applyRateLimit(req: NextRequest): Promise<NextResponse | null> {
  const config = getRateLimitConfig(req.nextUrl.pathname);
  if (!config) return null;

  const identifier = getClientIdentifier(req);
  const key = `${req.nextUrl.pathname}:${identifier}`;

  try {
    const { allowed, remaining } = await rateLimit(key, config.limit, config.windowSeconds);

    if (!allowed) {
      logger.warn("Rate limit exceeded", { identifier, path: req.nextUrl.pathname });
      return NextResponse.json(
        {
          error: {
            code: "RATE_LIMITED",
            message: "Too many requests. Please try again later.",
            retryable: true,
          },
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining": "0",
            "Retry-After": String(config.windowSeconds),
          },
        }
      );
    }

    return null;
  } catch (err) {
    logger.error("Rate limit check failed", { identifier }, err as Error);
    return null;
  }
}
