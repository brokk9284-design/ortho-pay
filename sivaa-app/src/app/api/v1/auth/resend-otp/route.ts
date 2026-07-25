import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { send2FACodeEmail } from "@/lib/email/service";
import { createHash, randomInt } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const admin = await createSupabaseAdminClient();

    // Find user by email — paginate through all users
    let user: { id: string; email?: string } | null = null;
    let page = 1;
    const perPage = 100;
    while (!user) {
      const { data: userList } = await admin.auth.admin.listUsers({ page, perPage });
      const users = userList?.users || [];
      if (users.length === 0) break;
      user = users.find((u) => u.email === email) || null;
      if (users.length < perPage) break;
      page++;
    }

    if (!user) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 400 }
      );
    }

    // Invalidate previous codes
    await admin
      .from("payment_2fa_codes")
      .update({ used: true })
      .eq("user_id", user.id)
      .eq("purpose", "registration")
      .eq("used", false);

    // Generate new code
    const code = randomInt(100000, 999999).toString();
    const codeHash = createHash("sha256").update(code).digest("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: otpInsertError } = await admin.from("payment_2fa_codes").insert({
      user_id: user.id,
      code_hash: codeHash,
      purpose: "registration",
      expires_at: expiresAt,
      used: false,
    });

    if (otpInsertError) {
      console.error("[resend-otp] Code insert error:", otpInsertError.message);
      return NextResponse.json(
        { error: "Failed to generate verification code. Please try again." },
        { status: 500 }
      );
    }

    // Get profile name
    const { data: profile } = await admin
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .single();

    // Send new code
    await send2FACodeEmail(email, profile?.name || "User", code, "verify your email and activate your account");

    return NextResponse.json({ message: "New verification code sent" });
  } catch (err) {
    console.error("Resend OTP error:", err);
    return NextResponse.json(
      { error: "Failed to resend code" },
      { status: 500 }
    );
  }
}
