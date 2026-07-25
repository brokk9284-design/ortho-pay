import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { createHash } from "crypto";
import { sendWelcomeEmail } from "@/lib/email/service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and code are required" },
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
        { error: "Account not found", invalid: true },
        { status: 400 }
      );
    }

    // Verify the OTP code
    const codeHash = createHash("sha256").update(code).digest("hex");

    const { data: record, error } = await admin
      .from("payment_2fa_codes")
      .select("code_id, expires_at, used")
      .eq("user_id", user.id)
      .eq("code_hash", codeHash)
      .eq("purpose", "registration")
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[verify-otp] DB query error:", error.message);
      return NextResponse.json(
        { error: "Invalid verification code", invalid: true },
        { status: 400 }
      );
    }

    if (!record) {
      console.log("[verify-otp] No matching code found for user:", user.id);
      return NextResponse.json(
        { error: "Invalid verification code", invalid: true },
        { status: 400 }
      );
    }

    if (new Date(record.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "Verification code expired", expired: true },
        { status: 400 }
      );
    }

    // Mark code as used
    await admin
      .from("payment_2fa_codes")
      .update({ used: true })
      .eq("code_id", record.code_id);

    // Confirm the user's email in Supabase Auth
    await admin.auth.admin.updateUserById(user.id, {
      email_confirm: true,
    });

    // Send welcome email now that verification is complete
    const { data: profile } = await admin
      .from("profiles")
      .select("name, siva_tag")
      .eq("id", user.id)
      .single();

    if (profile?.siva_tag) {
      await sendWelcomeEmail(email, profile.name || "User", profile.siva_tag);
    }

    return NextResponse.json({
      verified: true,
      message: "Email verified successfully",
    });
  } catch (err) {
    console.error("Verify OTP error:", err);
    return NextResponse.json(
      { error: "Verification failed: " + (err instanceof Error ? err.message : String(err)) },
      { status: 500 }
    );
  }
}
