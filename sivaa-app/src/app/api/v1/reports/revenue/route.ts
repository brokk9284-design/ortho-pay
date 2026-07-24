import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
    const supabase = await createSupabaseServerClient();

    // Total volume and revenue from completed payments
    const { data: completedPayments } = await supabase
      .from("payments")
      .select("gross_amount, fee_amount, created_at")
      .eq("status", "completed");

    const totalVolume = completedPayments?.reduce((sum, p) => sum + p.gross_amount, 0) || 0;
    const totalRevenue = completedPayments?.reduce((sum, p) => sum + p.fee_amount, 0) || 0;

    // Pending escrow count
    const { count: pendingCount } = await supabase
      .from("payments")
      .select("*", { count: "exact", head: true })
      .in("status", ["pending", "under_review", "escrow_held"]);

    // Today's volume
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { data: todayPayments } = await supabase
      .from("payments")
      .select("gross_amount, fee_amount")
      .eq("status", "completed")
      .gte("created_at", today.toISOString());

    const todayVolume = todayPayments?.reduce((sum, p) => sum + p.gross_amount, 0) || 0;
    const todayRevenue = todayPayments?.reduce((sum, p) => sum + p.fee_amount, 0) || 0;

    // Total users
    const { count: totalUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      total_volume: totalVolume,
      total_revenue: totalRevenue,
      pending_escrow: pendingCount,
      today_volume: todayVolume,
      today_revenue: todayRevenue,
      total_users: totalUsers,
    });
  } catch (err) {
    if (err instanceof Response) {
      return NextResponse.json({ error: "Admin access required" }, { status: err.status });
    }
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
}
