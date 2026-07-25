import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAuth, requireAdmin } from "@/lib/auth";
import { generateReference } from "@/lib/utils";
import { createHash } from "crypto";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = supabase
      .from("withdrawals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data: withdrawals, error } = await query.limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ withdrawals });
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
    const { withdrawal_type, amount, two_factor_code, details } = body;

    if (!withdrawal_type || !amount || !two_factor_code) {
      return NextResponse.json(
        { error: "withdrawal_type, amount, and two_factor_code are required" },
        { status: 400 }
      );
    }

    if (!["crypto", "cash"].includes(withdrawal_type)) {
      return NextResponse.json(
        { error: "withdrawal_type must be 'crypto' or 'cash'" },
        { status: 400 }
      );
    }

    if (typeof amount !== "number" || isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be a positive number" },
        { status: 400 }
      );
    }

    if (withdrawal_type === "crypto" && !details?.crypto_currency) {
      return NextResponse.json(
        { error: "crypto_currency is required for crypto withdrawals" },
        { status: 400 }
      );
    }

    if (withdrawal_type === "crypto" && !details?.wallet_address) {
      return NextResponse.json(
        { error: "wallet_address is required for crypto withdrawals" },
        { status: 400 }
      );
    }

    if (withdrawal_type === "cash" && !details?.country) {
      return NextResponse.json(
        { error: "country is required for cash withdrawals" },
        { status: 400 }
      );
    }

    if (withdrawal_type === "cash" && !details?.account_details) {
      return NextResponse.json(
        { error: "account_details is required for cash withdrawals" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    // Verify 2FA code
    const codeHash = createHash("sha256").update(two_factor_code).digest("hex");
    const { data: codeRecord } = await supabase
      .from("payment_2fa_codes")
      .select("code_id, expires_at, used")
      .eq("user_id", user.id)
      .eq("code_hash", codeHash)
      .eq("purpose", "withdrawal")
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!codeRecord) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
    }

    if (new Date(codeRecord.expires_at) < new Date()) {
      return NextResponse.json({ error: "Verification code expired. Please request a new one." }, { status: 400 });
    }

    // Mark code as used
    await supabase
      .from("payment_2fa_codes")
      .update({ used: true })
      .eq("code_id", codeRecord.code_id);

    const { data: wallet } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    if (wallet.status !== "active") {
      return NextResponse.json({ error: "Wallet is not active" }, { status: 403 });
    }

    const availableBalance = wallet.total_received - wallet.total_sent;
    if (amount > availableBalance) {
      return NextResponse.json(
        { error: `Insufficient balance. Available: $${availableBalance.toFixed(2)}` },
        { status: 400 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("kyc_status")
      .eq("id", user.id)
      .single();

    if (profile?.kyc_status !== "verified") {
      return NextResponse.json(
        { error: "KYC verification required to withdraw funds" },
        { status: 403 }
      );
    }

    const reference = generateReference("WD");

    const { data: withdrawal, error } = await supabase
      .from("withdrawals")
      .insert({
        user_id: user.id,
        wallet_id: wallet.wallet_id,
        withdrawal_type,
        amount,
        reference,
        status: "pending",
        details: details || {},
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Lock the funds
    const newLocked = Math.round((wallet.locked_balance + amount) * 100) / 100;
    await supabase
      .from("wallets")
      .update({ locked_balance: newLocked })
      .eq("wallet_id", wallet.wallet_id);

    await supabase.from("wallet_transactions").insert({
      wallet_id: wallet.wallet_id,
      amount: -amount,
      type: "escrow_hold",
      description: `Withdrawal hold — ${reference}`,
    });

    return NextResponse.json({
      message: "Withdrawal request submitted — pending admin approval",
      withdrawal,
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
    const { withdrawal_id, action } = body;

    if (!withdrawal_id || !action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "withdrawal_id and action ('approve' or 'reject') are required" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    const { data: withdrawal } = await supabase
      .from("withdrawals")
      .select("*")
      .eq("withdrawal_id", withdrawal_id)
      .single();

    if (!withdrawal) {
      return NextResponse.json({ error: "Withdrawal not found" }, { status: 404 });
    }

    if (withdrawal.status !== "pending") {
      return NextResponse.json({ error: "Withdrawal already processed" }, { status: 400 });
    }

    const { data: wallet } = await supabase
      .from("wallets")
      .select("*")
      .eq("wallet_id", withdrawal.wallet_id)
      .single();

    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    if (action === "approve") {
      const newTotalSent = Math.round((wallet.total_sent + withdrawal.amount) * 100) / 100;
      const newLocked = Math.round((wallet.locked_balance - withdrawal.amount) * 100) / 100;

      await supabase
        .from("wallets")
        .update({ total_sent: newTotalSent, locked_balance: newLocked })
        .eq("wallet_id", wallet.wallet_id);

      await supabase.from("wallet_transactions").insert({
        wallet_id: wallet.wallet_id,
        amount: -withdrawal.amount,
        type: "transfer_out",
        description: `Withdrawal approved — ${withdrawal.reference}`,
      });

      await supabase
        .from("withdrawals")
        .update({
          status: "approved",
          reviewed_by: admin.admin_id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("withdrawal_id", withdrawal_id);

      await supabase.from("notifications").insert({
        user_id: withdrawal.user_id,
        title: "Withdrawal approved",
        message: `Your withdrawal of $${withdrawal.amount.toFixed(2)} has been approved and is being processed.`,
        type: "withdrawal",
      });

      await supabase.from("audit_logs").insert({
        actor_id: admin.admin_id,
        actor_type: "admin",
        action: "Approve withdrawal",
        table_name: "withdrawals",
        record_id: withdrawal_id,
        new_value: { status: "approved", amount: withdrawal.amount },
      });

      return NextResponse.json({ message: "Withdrawal approved" });
    } else {
      const newLocked = Math.round((wallet.locked_balance - withdrawal.amount) * 100) / 100;

      await supabase
        .from("wallets")
        .update({ locked_balance: newLocked })
        .eq("wallet_id", wallet.wallet_id);

      await supabase.from("wallet_transactions").insert({
        wallet_id: wallet.wallet_id,
        amount: withdrawal.amount,
        type: "escrow_refund",
        description: `Withdrawal rejected — funds released — ${withdrawal.reference}`,
      });

      await supabase
        .from("withdrawals")
        .update({
          status: "rejected",
          reviewed_by: admin.admin_id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("withdrawal_id", withdrawal_id);

      await supabase.from("notifications").insert({
        user_id: withdrawal.user_id,
        title: "Withdrawal rejected",
        message: `Your withdrawal of $${withdrawal.amount.toFixed(2)} was not approved. Funds have been released back to your account.`,
        type: "withdrawal",
      });

      await supabase.from("audit_logs").insert({
        actor_id: admin.admin_id,
        actor_type: "admin",
        action: "Reject withdrawal",
        table_name: "withdrawals",
        record_id: withdrawal_id,
        new_value: { status: "rejected" },
      });

      return NextResponse.json({ message: "Withdrawal rejected and funds released" });
    }
  } catch (err) {
    if (err instanceof Response) {
      return NextResponse.json({ error: "Admin access required" }, { status: err.status });
    }
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
}
