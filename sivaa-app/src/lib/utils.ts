import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { createHash } from "crypto";

export function hashPin(pin: string): string {
  return createHash("sha256").update(pin).digest("hex");
}

export function calculateFee(amount: number, feeRules: { minimum_amount: number; maximum_amount: number | null; percentage: number }[]) {
  for (const rule of feeRules) {
    const min = rule.minimum_amount;
    const max = rule.maximum_amount;
    if (amount >= min && (max === null || amount <= max)) {
      return Math.round(amount * (rule.percentage / 100) * 100) / 100;
    }
  }
  return 0;
}

export async function getActiveFeeRules() {
  const supabase = await createSupabaseAdminClient();
  const { data } = await supabase
    .from("fee_rules")
    .select("*")
    .eq("active", true)
    .order("minimum_amount", { ascending: true });
  return data || [];
}

export function generateReference(prefix = "ORTHO-PAY") {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.floor(Math.random() * 90000 + 10000);
  return `${prefix}-${timestamp}-${random}`;
}

export async function generateSivaTag(name: string): Promise<string> {
  const base = name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10);
  const supabase = await createSupabaseAdminClient();
  
  for (let attempt = 0; attempt < 5; attempt++) {
    const random = Math.floor(Math.random() * 9000 + 1000);
    const tag = `${base}${random}`;
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("siva_tag", tag)
      .maybeSingle();
    if (!data) return tag;
  }
  
  const fallback = `${base}${Date.now().toString(36)}`;
  return fallback.slice(0, 30);
}
