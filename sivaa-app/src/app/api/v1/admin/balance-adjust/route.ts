import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { admin } = await requireAdmin();
    const body = await request.json();
    const { user_id, amount, action, reason } = body;

    if (!user_id || !amount || !action || !["add", "remove"].includes(action)) {
      return NextResponse.json(
        { error: "user_id, amount, and action ('add' or 'remove') are required" },
        { status: 400 }
      );
    }

    if (typeof amount !== "number" || isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be a positive number" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    const { data: wallet } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", user_id)
      .single();

    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    if (action === "add") {
      const newTotalReceived = Math.round((wallet.total_received + amount) * 100) / 100;
      const { error: walletError } = await supabase
        .from("wallets")
        .update({ total_received: newTotalReceived })
        .eq("wallet_id", wallet.wallet_id);

      if (walletError) {
        return NextResponse.json({ error: `Failed to update wallet: ${walletError.message}` }, { status: 500 });
      }

      await supabase.from("wallet_transactions").insert({
        wallet_id: wallet.wallet_id,
        amount,
        type: "adjust_in",
        description: reason || `Admin credit by ${admin.admin_id}`,
      });

      await supabase.from("notifications").insert({
        user_id,
        title: "Balance adjusted",
        message: `Your account has been credited with $${amount.toFixed(2)} by admin.`,
        type: "general",
      });

      await supabase.from("audit_logs").insert({
        actor_id: admin.admin_id,
        actor_type: "admin",
        action: "Manual balance credit",
        table_name: "wallets",
        record_id: wallet.wallet_id,
        new_value: { amount, action: "add", reason },
      });

      return NextResponse.json({ message: "Balance added successfully" });
    } else {
      const newTotalSent = Math.round((wallet.total_sent + amount) * 100) / 100;
      const { error: walletError } = await supabase
        .from("wallets")
        .update({ total_sent: newTotalSent })
        .eq("wallet_id", wallet.wallet_id);

      if (walletError) {
        return NextResponse.json({ error: `Failed to update wallet: ${walletError.message}` }, { status: 500 });
      }

      await supabase.from("wallet_transactions").insert({
        wallet_id: wallet.wallet_id,
        amount: -amount,
        type: "adjust_out",
        description: reason || `Admin debit by ${admin.admin_id}`,
      });

      await supabase.from("notifications").insert({
        user_id,
        title: "Balance adjusted",
        message: `Your account has been debited by $${amount.toFixed(2)} by admin.`,
        type: "general",
      });

      await supabase.from("audit_logs").insert({
        actor_id: admin.admin_id,
        actor_type: "admin",
        action: "Manual balance debit",
        table_name: "wallets",
        record_id: wallet.wallet_id,
        new_value: { amount, action: "remove", reason },
      });

      return NextResponse.json({ message: "Balance removed successfully" });
    }
  } catch (err) {
    if (err instanceof Response) {
      return NextResponse.json({ error: "Admin access required" }, { status: err.status });
    }
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
}
