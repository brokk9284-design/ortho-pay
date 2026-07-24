import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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

    // Get payment
    const { data: payment } = await supabase
      .from("payments")
      .select("*")
      .eq("payment_id", payment_id)
      .single();

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.status !== "escrow_held" && payment.status !== "under_review") {
      return NextResponse.json(
        { error: `Payment is in ${payment.status} state, cannot approve` },
        { status: 400 }
      );
    }

    // Get receiver wallet
    const { data: receiverWallet } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", payment.receiver_id)
      .single();

    if (!receiverWallet) {
      return NextResponse.json({ error: "Receiver wallet not found" }, { status: 404 });
    }

    if (receiverWallet.status !== "active") {
      return NextResponse.json(
        { error: `Receiver wallet is ${receiverWallet.status}. Cannot credit funds to a non-active wallet.` },
        { status: 403 }
      );
    }

    // Get sender wallet (to reduce locked_balance)
    const { data: senderWallet } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", payment.sender_id)
      .single();

    if (!senderWallet) {
      return NextResponse.json({ error: "Sender wallet not found" }, { status: 404 });
    }

    // Update totals and release escrow
    const newSenderTotalSent = Math.round((senderWallet.total_sent + payment.gross_amount) * 100) / 100;
    const newReceiverTotalReceived = Math.round((receiverWallet.total_received + payment.net_amount) * 100) / 100;
    const newSenderLocked = Math.round((senderWallet.locked_balance - payment.gross_amount) * 100) / 100;

    await supabase
      .from("wallets")
      .update({ total_received: newReceiverTotalReceived })
      .eq("wallet_id", receiverWallet.wallet_id);

    await supabase
      .from("wallets")
      .update({ total_sent: newSenderTotalSent, locked_balance: newSenderLocked })
      .eq("wallet_id", senderWallet.wallet_id);

    // Get sender profile for transaction description
    const { data: senderProfile } = await supabase
      .from("profiles")
      .select("siva_tag")
      .eq("id", payment.sender_id)
      .single();

    // Record wallet transaction for receiver
    await supabase.from("wallet_transactions").insert({
      wallet_id: receiverWallet.wallet_id,
      amount: payment.net_amount,
      type: "escrow_release",
      payment_id: payment.payment_id,
      description: `Escrow released from $${senderProfile?.siva_tag || payment.sender_id}`,
    });

    // Update payment status
    await supabase
      .from("payments")
      .update({
        status: "completed",
        approved_at: new Date().toISOString(),
        approved_by: admin.admin_id,
        escrow_notes: notes || null,
      })
      .eq("payment_id", payment_id);

    // Log escrow review
    await supabase.from("escrow_reviews").insert({
      payment_id,
      admin_id: admin.admin_id,
      action: "approved",
      notes: notes || null,
    });

    // Notify both parties
    await supabase.from("notifications").insert([
      {
        user_id: payment.receiver_id,
        title: "Payment approved",
        message: `$${payment.net_amount.toFixed(2)} has been credited to your wallet.`,
        type: "payment",
      },
      {
        user_id: payment.sender_id,
        title: "Escrow approved",
        message: `Your payment of $${payment.gross_amount.toFixed(2)} has been approved and released to the receiver.`,
        type: "escrow",
      },
    ]);

    // Send email notifications to both parties
    const { data: senderProfileFull } = await supabase
      .from("profiles")
      .select("name, email, siva_tag")
      .eq("id", payment.sender_id)
      .single();
    const { data: receiverProfileFull } = await supabase
      .from("profiles")
      .select("name, email, siva_tag")
      .eq("id", payment.receiver_id)
      .single();

    if (senderProfileFull?.email) {
      await sendEscrowStatusEmail(
        senderProfileFull.email,
        senderProfileFull.name || "User",
        payment.gross_amount,
        receiverProfileFull?.siva_tag || "unknown",
        "approved",
        "sent"
      );
    }
    if (receiverProfileFull?.email) {
      await sendEscrowStatusEmail(
        receiverProfileFull.email,
        receiverProfileFull.name || "User",
        payment.net_amount,
        senderProfileFull?.siva_tag || "unknown",
        "approved",
        "received"
      );
    }

    // Post system message to transaction chat
    const chatId = await getOrCreateChat(payment.sender_id, payment.receiver_id);
    await addSystemMessage(
      chatId,
      `Escrow approved — $${payment.net_amount.toFixed(2)} released to $${receiverProfileFull?.siva_tag || "receiver"}.`,
      "escrow_approved",
      { paymentId: payment.payment_id }
    );

    return NextResponse.json({
      message: "Payment approved — funds released from escrow",
      payment_id,
    });
  } catch (err) {
    if (err instanceof Response) {
      return NextResponse.json({ error: "Admin access required" }, { status: err.status });
    }
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
}
