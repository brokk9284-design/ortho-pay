import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const user = await requireAuth();
    const supabase = await createSupabaseServerClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, siva_tag, name, avatar_url, kyc_status")
      .eq("id", user.id)
      .single();

    return NextResponse.json({ user: { id: user.id, email: user.email, ...profile } });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
