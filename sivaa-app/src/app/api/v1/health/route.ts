import { NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { HealthCheck } from "@/types";

export async function GET() {
  const timestamp = new Date().toISOString();
  const services: HealthCheck["services"] = {
    database: "down",
    redis: "down",
    email: "down",
    sms: "down",
  };

  try {
    const supabase = await createSupabaseAdminClient();
    const { error } = await supabase.from("profiles").select("id").limit(1);
    services.database = error ? "down" : "up";
  } catch {
    services.database = "down";
  }

  try {
    const redis = getRedis();
    await redis.ping();
    services.redis = "up";
  } catch {
    services.redis = "down";
  }

  services.email = process.env.RESEND_API_KEY ? "up" : "down";
  services.sms = process.env.TWILIO_ACCOUNT_SID ? "up" : "down";

  const allUp = Object.values(services).every((s) => s === "up");
  const anyUp = Object.values(services).some((s) => s === "up");

  const status: HealthCheck["status"] = allUp ? "healthy" : anyUp ? "degraded" : "unhealthy";

  const response: HealthCheck = { status, services, timestamp };

  return NextResponse.json(response, { status: status === "unhealthy" ? 503 : 200 });
}
