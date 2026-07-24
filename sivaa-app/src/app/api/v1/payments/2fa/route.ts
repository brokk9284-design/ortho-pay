import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { createHash, randomInt } from "crypto";
import { send2FACodeEmail } from "@/lib/email/service";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { purpose } = body;

    if (!purpose || !["payment_send", "payment_fulfill"].includes(purpose)) {
      return NextResponse.json(
        { error: "purpose must be 'payment_send' or 'payment_fulfill'" },
        { status: 400 }
      );
    }

    const code = randomInt(100000, 999999).toString();
    const codeHash = createHash("sha256").update(code).digest("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const supabase = await createSupabaseServerClient();

    await supabase
      .from("payment_2fa_codes")
      .update({ used: true })
      .eq("user_id", user.id)
      .eq("purpose", purpose)
      .eq("used", false);

    await supabase.from("payment_2fa_codes").insert({
      user_id: user.id,
      code_hash: codeHash,
      purpose,
      expires_at: expiresAt,
      used: false,
    });

    const { data: profile } = await supabase
      .from("profiles")
      .select("name, email")
      .eq("id", user.id)
      .single();

    if (profile?.email) {
      const purposeText = purpose === "payment_send" ? "confirm your payment" : "fulfill the payment request";
      await send2FACodeEmail(profile.email, profile.name || "User", code, purposeText);
    }

    return NextResponse.json({ message: "Verification code sent to your email" });
  } catch (err) {
    if (err instanceof Response) {
      return NextResponse.json({ error: "Unauthorized" }, { status: err.status });
    }
    return NextResponse.json({ error: "Failed to send verification code" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { code, purpose } = body;

    if (!code || !purpose) {
      return NextResponse.json({ error: "code and purpose are required" }, { status: 400 });
    }

    const codeHash = createHash("sha256").update(code).digest("hex");
    const supabase = await createSupabaseServerClient();

    const { data: record, error } = await supabase
      .from("payment_2fa_codes")
      .select("code_id, expires_at, used")
      .eq("user_id", user.id)
      .eq("code_hash", codeHash)
      .eq("purpose", purpose)
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !record) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
    }

    if (new Date(record.expires_at) < new Date()) {
      return NextResponse.json({ error: "Verification code expired. Please request a new one." }, { status: 400 });
    }

    await supabase
      .from("payment_2fa_codes")
      .update({ used: true })
      .eq("code_id", record.code_id);

    return NextResponse.json({ verified: true });
  } catch (err) {
    if (err instanceof Response) {
      return NextResponse.json({ error: "Unauthorized" }, { status: err.status });
    }
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
