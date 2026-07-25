import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAuth, requireAdmin } from "@/lib/auth";
import { generateReference } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = supabase
      .from("deposits")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data: deposits, error } = await query.limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ deposits });
  } catch (err) {
    if (err instanceof Response) {
      return NextResponse.json({ error: "Unauthorized" }, { status: err.status });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { payment_method_id, amount } = body;

    if (!payment_method_id || !amount) {
      return NextResponse.json(
        { error: "payment_method_id and amount are required" },
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
      .select("wallet_id, status")
      .eq("user_id", user.id)
      .single();

    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    if (wallet.status !== "active") {
      return NextResponse.json({ error: "Wallet is not active" }, { status: 403 });
    }

    const { data: method } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("method_id", payment_method_id)
      .eq("is_active", true)
      .single();

    if (!method) {
      return NextResponse.json({ error: "Invalid or inactive payment method" }, { status: 400 });
    }

    if (amount < method.min_amount) {
      return NextResponse.json(
        { error: `Minimum amount for ${method.display_name} is $${method.min_amount}` },
        { status: 400 }
      );
    }

    if (method.max_amount && amount > method.max_amount) {
      return NextResponse.json(
        { error: `Maximum amount for ${method.display_name} is $${method.max_amount}` },
        { status: 400 }
      );
    }

    const reference = generateReference("DEP");

    const { data: deposit, error } = await supabase
      .from("deposits")
      .insert({
        user_id: user.id,
        wallet_id: wallet.wallet_id,
        payment_method_id,
        amount,
        reference,
        status: "pending",
        payment_details: method.config || {},
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      deposit,
      payment_instructions: method.config || {},
      method_name: method.display_name,
    });
  } catch (err) {
    if (err instanceof Response) {
      return NextResponse.json({ error: "Unauthorized" }, { status: err.status });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { admin } = await requireAdmin();
    const body = await request.json();
    const { deposit_id, action } = body;

    if (!deposit_id || !action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "deposit_id and action ('approve' or 'reject') are required" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    const { data: deposit } = await supabase
      .from("deposits")
      .select("*")
      .eq("deposit_id", deposit_id)
      .single();

    if (!deposit) {
      return NextResponse.json({ error: "Deposit not found" }, { status: 404 });
    }

    if (deposit.status !== "pending") {
      return NextResponse.json({ error: "Deposit already processed" }, { status: 400 });
    }

    if (action === "approve") {
      const { data: wallet } = await supabase
        .from("wallets")
        .select("*")
        .eq("wallet_id", deposit.wallet_id)
        .single();

      if (!wallet) {
        return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
      }

      const newTotalReceived = Math.round((wallet.total_received + deposit.amount) * 100) / 100;

      const { error: walletError } = await supabase
        .from("wallets")
        .update({ total_received: newTotalReceived })
        .eq("wallet_id", wallet.wallet_id);

      if (walletError) {
        return NextResponse.json({ error: `Failed to update wallet: ${walletError.message}` }, { status: 500 });
      }

      await supabase.from("wallet_transactions").insert({
        wallet_id: wallet.wallet_id,
        amount: deposit.amount,
        type: "adjust_in",
        description: `Deposit approved — ${deposit.reference}`,
      });

      await supabase
        .from("deposits")
        .update({
          status: "approved",
          reviewed_by: admin.admin_id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("deposit_id", deposit_id);

      await supabase.from("notifications").insert({
        user_id: deposit.user_id,
        title: "Deposit approved",
        message: `Your deposit of $${deposit.amount.toFixed(2)} has been approved and credited to your account.`,
        type: "deposit",
      });

      await supabase.from("audit_logs").insert({
        actor_id: admin.admin_id,
        actor_type: "admin",
        action: "Approve deposit",
        table_name: "deposits",
        record_id: deposit_id,
        new_value: { status: "approved", amount: deposit.amount },
      });

      return NextResponse.json({ message: "Deposit approved and balance credited" });
    } else {
      await supabase
        .from("deposits")
        .update({
          status: "rejected",
          reviewed_by: admin.admin_id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("deposit_id", deposit_id);

      await supabase.from("notifications").insert({
        user_id: deposit.user_id,
        title: "Deposit rejected",
        message: `Your deposit of $${deposit.amount.toFixed(2)} was not approved. Please contact support.`,
        type: "deposit",
      });

      await supabase.from("audit_logs").insert({
        actor_id: admin.admin_id,
        actor_type: "admin",
        action: "Reject deposit",
        table_name: "deposits",
        record_id: deposit_id,
        new_value: { status: "rejected" },
      });

      return NextResponse.json({ message: "Deposit rejected" });
    }
  } catch (err) {
    if (err instanceof Response) {
      return NextResponse.json({ error: "Admin access required" }, { status: err.status });
    }
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
}
