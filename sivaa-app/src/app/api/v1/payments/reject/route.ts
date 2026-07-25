import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { sendEscrowStatusEmail } from "@/lib/email/service";
import { getOrCreateChat, addSystemMessage } from "@/lib/chat";

export async function POST(request: NextRequest) {
  try {
    const { admin } = await requireAdmin();
    const body = await request.json();
    const { payment_id, notes } = body;

    if (!payment_id) {
      return NextResponse.json(
        { error: "payment_id is required" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const adminClient = await createSupabaseAdminClient();

    // Get payment
    const { data: payment } = await adminClient
      .from("payments")
      .select("*")
      .eq("payment_id", payment_id)
      .single();

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.status !== "escrow_held" && payment.status !== "under_review") {
      return NextResponse.json(
        { error: `Payment is in ${payment.status} state, cannot reject` },
        { status: 400 }
      );
    }

    // Get sender wallet to refund
    const { data: senderWallet } = await adminClient
      .from("wallets")
      .select("*")
      .eq("user_id", payment.sender_id)
      .single();

    if (!senderWallet) {
      return NextResponse.json({ error: "Sender wallet not found" }, { status: 404 });
    }

    // Refund locked funds to sender
    // Unlock escrow funds (no balance to refund — ORTHO-PAY is an agent)
    const newLocked = Math.round((senderWallet.locked_balance - payment.gross_amount) * 100) / 100;

    await adminClient
      .from("wallets")
      .update({ locked_balance: newLocked })
      .eq("wallet_id", senderWallet.wallet_id);

    // Record refund transaction
    await adminClient.from("wallet_transactions").insert({
      wallet_id: senderWallet.wallet_id,
      amount: payment.gross_amount,
      type: "escrow_refund",
      payment_id: payment.payment_id,
      description: `Escrow refund — payment rejected`,
    });

    // Update payment status
    await adminClient
      .from("payments")
      .update({
        status: "reversed",
        approved_at: new Date().toISOString(),
        approved_by: admin.admin_id,
        escrow_notes: notes || null,
      })
      .eq("payment_id", payment_id);

    // Log escrow review
    await adminClient.from("escrow_reviews").insert({
      payment_id,
      admin_id: admin.admin_id,
      action: "rejected",
      notes: notes || null,
    });

    // Notify sender
    await adminClient.from("notifications").insert({
      user_id: payment.sender_id,
      title: "Payment rejected",
      message: `Your payment of $${payment.gross_amount.toFixed(2)} has been rejected and refunded to your wallet.`,
      type: "escrow",
    });

    // Send email notification to sender
    const { data: senderProfile } = await adminClient
      .from("profiles")
      .select("name, email, siva_tag")
      .eq("id", payment.sender_id)
      .single();
    const { data: receiverProfile } = await adminClient
      .from("profiles")
      .select("siva_tag")
      .eq("id", payment.receiver_id)
      .single();

    if (senderProfile?.email) {
      await sendEscrowStatusEmail(
        senderProfile.email,
        senderProfile.name || "User",
        payment.gross_amount,
        receiverProfile?.siva_tag || "unknown",
        "rejected",
        "sent"
      );
    }

    // Post system message to transaction chat
    const chatId = await getOrCreateChat(payment.sender_id, payment.receiver_id);
    await addSystemMessage(
      chatId,
      `Escrow rejected — $${payment.gross_amount.toFixed(2)} refunded to $${senderProfile?.siva_tag || "sender"}.`,
      "escrow_rejected",
      { paymentId: payment.payment_id }
    );

    return NextResponse.json({
      message: "Payment rejected — funds refunded to sender",
      payment_id,
    });
  } catch (err) {
    if (err instanceof Response) {
      return NextResponse.json({ error: "Admin access required" }, { status: err.status });
    }
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
}
