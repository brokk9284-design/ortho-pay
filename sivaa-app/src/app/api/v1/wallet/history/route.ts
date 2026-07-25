import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireAuth();
    const supabase = await createSupabaseServerClient();

    const { data: wallet } = await supabase
      .from("wallets")
      .select("wallet_id, total_received, total_sent, locked_balance, status")
      .eq("user_id", user.id)
      .single();

    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    const { data: transactions, error } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("wallet_id", wallet.wallet_id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ wallet, transactions });
  } catch (err) {
    if (err instanceof Response) {
      return NextResponse.json({ error: "Unauthorized" }, { status: err.status });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
