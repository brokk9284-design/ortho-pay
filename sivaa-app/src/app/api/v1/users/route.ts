import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const supabase = await createSupabaseServerClient();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");

    let query = supabase
      .from("profiles")
      .select(`
        id, siva_tag, name, email, phone, country, kyc_status, created_at,
        wallets (wallet_id, status, total_sent, total_received, locked_balance)
      `)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (search) {
      query = query.or(`siva_tag.ilike.%${search}%,name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: users, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ users });
  } catch (err) {
    if (err instanceof Response) {
      return NextResponse.json({ error: "Admin access required" }, { status: err.status });
    }
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
}
