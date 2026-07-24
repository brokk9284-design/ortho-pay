import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
    const supabase = await createSupabaseServerClient();

    // Large transactions (>$10,000)
    const { data: largePayments } = await supabase
      .from("payments")
      .select(`
        *,
        sender:profiles!sender_id(siva_tag, name),
        receiver:profiles!receiver_id(siva_tag, name)
      `)
      .gte("gross_amount", 10000)
      .order("created_at", { ascending: false })
      .limit(20);

    // High frequency senders (more than 10 payments in 24h)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const { data: recentPayments } = await supabase
      .from("payments")
      .select("sender_id, created_at")
      .gte("created_at", yesterday.toISOString());

    const senderCounts: Record<string, number> = {};
    recentPayments?.forEach((p) => {
      senderCounts[p.sender_id] = (senderCounts[p.sender_id] || 0) + 1;
    });

    const highFrequencySenderIds = Object.entries(senderCounts)
      .filter(([_, count]) => count > 10)
      .map(([id]) => id);

    const highFrequencySenders: { siva_tag: string; name: string; count: number }[] = [];
    if (highFrequencySenderIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, siva_tag, name")
        .in("id", highFrequencySenderIds);

      profiles?.forEach((p) => {
        highFrequencySenders.push({
          siva_tag: p.siva_tag,
          name: p.name,
          count: senderCounts[p.id],
        });
      });
    }

    return NextResponse.json({
      large_transactions: largePayments || [],
      high_frequency_senders: highFrequencySenders,
    });
  } catch (err) {
    if (err instanceof Response) {
      return NextResponse.json({ error: "Admin access required" }, { status: err.status });
    }
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
}
