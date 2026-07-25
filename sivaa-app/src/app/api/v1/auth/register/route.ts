import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { generateSivaTag } from "@/lib/utils";
import { send2FACodeEmail } from "@/lib/email/service";
import { createHash, randomInt } from "crypto";

export async function POST(request: NextRequest) {
  let createdUserId: string | null = null;

  try {
    const body = await request.json();
    const { email, password, name, country, marketing_consent } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password, and name are required" },
        { status: 400 }
      );
    }

    if (country && country.length !== 2) {
      return NextResponse.json(
        { error: "Country must be a 2-letter ISO code" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const admin = await createSupabaseAdminClient();

    // Check if user already exists in auth — paginate through all users
    let existing: { id: string; email?: string } | null = null;
    let page = 1;
    const perPage = 100;
    while (!existing) {
      const { data: existingUsers } = await admin.auth.admin.listUsers({ page, perPage });
      const users = existingUsers?.users || [];
      if (users.length === 0) break;
      existing = users.find((u) => u.email === email) || null;
      if (users.length < perPage) break;
      page++;
    }

    if (existing) {
      // Check if profile exists. If not, this is an orphaned auth user
      // from a failed registration — clean it up and allow retry.
      const { data: existingProfile } = await admin
        .from("profiles")
        .select("id")
        .eq("id", existing.id)
        .maybeSingle();

      if (!existingProfile) {
        console.log("[register] Found orphaned auth user, cleaning up:", existing.id);
        await admin.auth.admin.deleteUser(existing.id);
      } else {
        return NextResponse.json(
          { error: "An account with this email already exists. Try logging in instead." },
          { status: 400 }
        );
      }
    }

    // Create auth user but don't auto-confirm — require OTP
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
    });

    if (error) {
      const errMsg = error.message || error.name || "Registration failed";
      console.error("Supabase createUser error:", errMsg, error);
      return NextResponse.json({ error: errMsg }, { status: 400 });
    }

    if (!data.user) {
      return NextResponse.json(
        { error: "Registration failed" },
        { status: 500 }
      );
    }

    createdUserId = data.user.id;

    const sivaTag = await generateSivaTag(name);

    // Insert profile without marketing_consent (column may not exist yet).
    // If it fails, roll back the auth user so the user can retry.
    const { error: profileError } = await admin.from("profiles").insert({
      id: data.user.id,
      siva_tag: sivaTag,
      name,
      email,
      country: country || "US",
    });

    if (profileError) {
      console.error("Profile creation error:", profileError.message);
      // Rollback: delete the auth user so registration can be retried
      await admin.auth.admin.deleteUser(data.user.id);
      return NextResponse.json(
        { error: "Failed to create profile: " + profileError.message },
        { status: 500 }
      );
    }

    // Create wallet
    const { error: walletError } = await admin.from("wallets").insert({
      user_id: data.user.id,
      total_sent: 0,
      total_received: 0,
      locked_balance: 0,
      status: "active",
    });

    if (walletError) {
      console.error("Wallet creation error:", walletError.message);
      // Non-fatal: profile exists, user can still verify email
    }

    // Generate and store OTP code for registration verification
    const code = randomInt(100000, 999999).toString();
    const codeHash = createHash("sha256").update(code).digest("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: otpError } = await admin.from("payment_2fa_codes").insert({
      user_id: data.user.id,
      code_hash: codeHash,
      purpose: "registration",
      expires_at: expiresAt,
      used: false,
    });

    if (otpError) {
      console.error("OTP code insert error:", otpError.message);
      // Rollback: delete auth user and profile so registration can be retried
      await admin.auth.admin.deleteUser(data.user.id);
      return NextResponse.json(
        { error: "Failed to generate verification code. Please try again." },
        { status: 500 }
      );
    }

    // Send OTP code email
    const emailResult = await send2FACodeEmail(email, name, code, "verify your email and activate your account");

    if (emailResult && !emailResult.success) {
      console.error("OTP email send failed:", emailResult.error);
      // Code is in DB but email didn't send. User can use resend-otp.
    }

    return NextResponse.json({
      message: "Account created. Check your email for a verification code.",
      user: {
        id: data.user.id,
        email: data.user.email,
        siva_tag: sivaTag,
      },
      session: null,
    });
  } catch (err) {
    console.error("Register error:", err);

    // Last-resort rollback if we created an auth user but something threw
    if (createdUserId) {
      try {
        const admin = await createSupabaseAdminClient();
        await admin.auth.admin.deleteUser(createdUserId);
        console.log("[register] Rolled back orphaned auth user:", createdUserId);
      } catch (rollbackErr) {
        console.error("[register] Rollback failed:", rollbackErr);
      }
    }

    return NextResponse.json(
      { error: "Internal server error: " + (err instanceof Error ? err.message : String(err)) },
      { status: 500 }
    );
  }
}
