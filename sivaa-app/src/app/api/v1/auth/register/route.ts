import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { generateSivaTag } from "@/lib/utils";
import { sendWelcomeEmail, send2FACodeEmail } from "@/lib/email/service";
import { createHash, randomInt } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, country } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password, and name are required" },
        { status: 400 }
      );
    }

    if (country && !["US", "GB"].includes(country)) {
      return NextResponse.json(
        { error: "Country must be US or GB" },
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

    // Check if user already exists
    const { data: existingUsers } = await admin.auth.admin.listUsers();
    const existing = existingUsers?.users?.find((u) => u.email === email);
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists. Try logging in instead." },
        { status: 400 }
      );
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

    const sivaTag = await generateSivaTag(name);

    const { error: profileError } = await admin.from("profiles").insert({
      id: data.user.id,
      siva_tag: sivaTag,
      name,
      email,
      country: country || "US",
    });

    if (profileError) {
      console.error("Profile creation error:", profileError.message);
      return NextResponse.json(
        { error: "Failed to create profile: " + profileError.message },
        { status: 500 }
      );
    }

    // Create wallet
    await admin.from("wallets").insert({
      user_id: data.user.id,
      total_sent: 0,
      total_received: 0,
      locked_balance: 0,
      status: "active",
    });

    // Send welcome email
    await sendWelcomeEmail(email, name, sivaTag);

    // Generate and store OTP code for registration verification
    const code = randomInt(100000, 999999).toString();
    const codeHash = createHash("sha256").update(code).digest("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await admin.from("payment_2fa_codes").insert({
      user_id: data.user.id,
      code_hash: codeHash,
      purpose: "registration",
      expires_at: expiresAt,
      used: false,
    });

    // Send OTP code email
    await send2FACodeEmail(email, name, code, "verify your email and activate your account");

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
    return NextResponse.json(
      { error: "Internal server error: " + (err instanceof Error ? err.message : String(err)) },
      { status: 500 }
    );
  }
}
