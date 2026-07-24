import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateSivaTag } from "@/lib/utils";
import { sendWelcomeEmail } from "@/lib/email/service";

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

    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data.user) {
      return NextResponse.json(
        { error: "Registration failed" },
        { status: 500 }
      );
    }

    const sivaTag = await generateSivaTag(name);

    const { error: profileError } = await supabase.from("profiles").insert({
      id: data.user.id,
      siva_tag: sivaTag,
      name,
      email,
      country: country || "US",
    });

    if (profileError) {
      return NextResponse.json(
        { error: "Failed to create profile: " + profileError.message },
        { status: 500 }
      );
    }

    // Send welcome email
    await sendWelcomeEmail(email, name, sivaTag);

    return NextResponse.json({
      message: "Registration successful",
      user: {
        id: data.user.id,
        email: data.user.email,
        siva_tag: sivaTag,
      },
      session: {
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
        expires_at: data.session?.expires_at,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
