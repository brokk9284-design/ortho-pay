import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAuth, requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = await createSupabaseServerClient();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Check if user is admin
    let isAdmin = false;
    try {
      await requireAdmin();
      isAdmin = true;
    } catch {
      isAdmin = false;
    }

    let query = supabase
      .from("payments")
      .select(`
        *,
        sender:profiles!sender_id(siva_tag, name),
        receiver:profiles!receiver_id(siva_tag, name)
      `)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq("status", status);
    }

    // Non-admins can only see their own payments
    if (!isAdmin) {
      query = query.or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
    }

    const { data: payments, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ payments });
  } catch (err) {
    if (err instanceof Response) {
      return NextResponse.json({ error: "Unauthorized" }, { status: err.status });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
