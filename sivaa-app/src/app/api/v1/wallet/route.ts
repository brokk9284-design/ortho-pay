import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateReference } from "@/lib/utils";
import { requireAuth } from "@/lib/auth";
import { createHash } from "crypto";
import { sendPaymentConfirmationEmail } from "@/lib/email/service";
import { getOrCreateChat, addSystemMessage } from "@/lib/chat";

export async function GET() {
  try {
    const user = await requireAuth();
    const supabase = await createSupabaseServerClient();

    const { data: wallet, error } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ wallet });
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
    const { receiver_tag, amount, payment_method_id, two_factor_code, payment_request_id } = body;

    if (!two_factor_code) {
      return NextResponse.json(
        { error: "Two-factor verification code is required to send payments" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    const codeHash = createHash("sha256").update(two_factor_code).digest("hex");
    const { data: codeRecord } = await supabase
      .from("payment_2fa_codes")
      .select("code_id, expires_at, used")
      .eq("user_id", user.id)
      .eq("code_hash", codeHash)
      .eq("purpose", "payment_send")
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

    if (!receiver_tag || !amount || !payment_method_id) {
      return NextResponse.json(
        { error: "receiver_tag, amount, and payment_method_id are required" },
        { status: 400 }
      );
    }

    if (typeof amount !== "number" || isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be a positive number" },
        { status: 400 }
      );
    }

    // Get sender wallet
    const { data: senderWallet } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!senderWallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    if (senderWallet.status !== "active") {
      return NextResponse.json({ error: "Wallet is not active" }, { status: 403 });
    }

    // Get sender profile to check KYC status
    const { data: senderProfile } = await supabase
      .from("profiles")
      .select("siva_tag, kyc_status")
      .eq("id", user.id)
      .single();

    if (senderProfile?.kyc_status !== "verified") {
      return NextResponse.json(
        { error: "KYC verification required to send payments. Please submit your documents for review." },
        { status: 403 }
      );
    }

    // Find receiver by $ORTHO tag
    const { data: receiver } = await supabase
      .from("profiles")
      .select("id, siva_tag, name, kyc_status")
      .eq("siva_tag", receiver_tag.replace("$", ""))
      .single();

    if (!receiver) {
      return NextResponse.json(
        { error: `Receiver $${receiver_tag} not found` },
        { status: 404 }
      );
    }

    if (receiver.id === user.id) {
      return NextResponse.json(
        { error: "Cannot send to yourself" },
        { status: 400 }
      );
    }

    if (receiver.kyc_status !== "verified") {
      return NextResponse.json(
        { error: `Receiver $${receiver.siva_tag} has not completed KYC verification` },
        { status: 403 }
      );
    }

    // Check receiver wallet exists and is active
    const { data: receiverWallet } = await supabase
      .from("wallets")
      .select("status")
      .eq("user_id", receiver.id)
      .single();

    if (!receiverWallet) {
      return NextResponse.json(
        { error: `Receiver wallet not found` },
        { status: 404 }
      );
    }

    if (receiverWallet.status !== "active") {
      return NextResponse.json(
        { error: `Receiver wallet is not active` },
        { status: 403 }
      );
    }

    // Fetch payment method to calculate fee and validate limits
    const { data: paymentMethod } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("method_id", payment_method_id)
      .eq("is_active", true)
      .single();

    if (!paymentMethod) {
      return NextResponse.json(
        { error: "Invalid or inactive payment method" },
        { status: 400 }
      );
    }

    // Validate amount against method limits
    if (amount < paymentMethod.min_amount) {
      return NextResponse.json(
        { error: `Minimum amount for ${paymentMethod.display_name} is $${paymentMethod.min_amount}` },
        { status: 400 }
      );
    }

    if (paymentMethod.max_amount && amount > paymentMethod.max_amount) {
      return NextResponse.json(
        { error: `Maximum amount for ${paymentMethod.display_name} is $${paymentMethod.max_amount}` },
        { status: 400 }
      );
    }

    // Calculate fee using method-specific fee structure
    const percentageFee = Math.round(amount * (paymentMethod.fee_percentage / 100) * 100) / 100;
    const fee = Math.round((percentageFee + paymentMethod.fee_fixed) * 100) / 100;
    const net = Math.round((amount - fee) * 100) / 100;

    // ORTHO-PAY is an agent — no balance check needed. Funds are held in escrow during admin review.

    // All validations passed — mark 2FA code as used
    await supabase
      .from("payment_2fa_codes")
      .update({ used: true })
      .eq("code_id", codeRecord.code_id);

    const reference = generateReference();

    // Create payment in escrow
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        sender_id: user.id,
        receiver_id: receiver.id,
        gross_amount: amount,
        fee_amount: fee,
        net_amount: net,
        payment_method_id,
        reference,
        status: "pending",
      })
      .select()
      .single();

    if (paymentError) {
      return NextResponse.json(
        { error: paymentError.message },
        { status: 500 }
      );
    }

    // Lock funds in escrow (track in locked_balance)
    const newLocked = Math.round((senderWallet.locked_balance + amount) * 100) / 100;

    await supabase
      .from("wallets")
      .update({ locked_balance: newLocked })
      .eq("wallet_id", senderWallet.wallet_id);

    // Record wallet transactions
    await supabase.from("wallet_transactions").insert([
      {
        wallet_id: senderWallet.wallet_id,
        amount: -amount,
        type: "escrow_hold",
        payment_id: payment.payment_id,
        description: `Escrow hold for payment to $${receiver.siva_tag}`,
      },
      {
        wallet_id: senderWallet.wallet_id,
        amount: -fee,
        type: "fee",
        payment_id: payment.payment_id,
        description: `Fee for payment ${reference}`,
      },
    ]);

    // Notify receiver
    await supabase.from("notifications").insert({
      user_id: receiver.id,
      title: "Incoming escrow payment",
      message: `$${amount.toFixed(2)} from $${senderProfile?.siva_tag || "unknown"} is pending admin approval.`,
      type: "escrow",
    });

    // Update payment status to escrow_held
    await supabase
      .from("payments")
      .update({ status: "escrow_held" })
      .eq("payment_id", payment.payment_id);

    // Auto-create transaction chat and post system messages
    const chatId = await getOrCreateChat(user.id, receiver.id);
    await addSystemMessage(
      chatId,
      `Payment of $${amount.toFixed(2)} initiated to $${receiver.siva_tag} — Reference: ${reference}`,
      "payment_created",
      { paymentId: payment.payment_id }
    );
    await addSystemMessage(
      chatId,
      `Funds held in escrow. Waiting for admin approval.`,
      "escrow_held",
      { paymentId: payment.payment_id }
    );

    // If this payment fulfills a request, link it
    if (payment_request_id) {
      await supabase
        .from("payment_requests")
        .update({
          status: "fulfilled",
          fulfilled_payment_id: payment.payment_id,
          updated_at: new Date().toISOString(),
        })
        .eq("request_id", payment_request_id)
        .eq("requested_from_id", user.id)
        .eq("status", "pending");
    }

    // Send confirmation email to sender
    const { data: senderProfileFull } = await supabase
      .from("profiles")
      .select("name, email")
      .eq("id", user.id)
      .single();

    if (senderProfileFull?.email) {
      await sendPaymentConfirmationEmail(
        senderProfileFull.email,
        senderProfileFull.name || "User",
        amount,
        receiver.siva_tag,
        reference
      );
    }

    return NextResponse.json({
      message: "Payment initiated — funds held in escrow pending admin approval",
      payment: {
        payment_id: payment.payment_id,
        reference,
        receiver: `$${receiver.siva_tag}`,
        gross_amount: amount,
        fee_amount: fee,
        net_amount: net,
        status: "escrow_held",
      },
      chat_id: chatId,
    });
  } catch (err) {
    if (err instanceof Response) {
      return NextResponse.json({ error: "Unauthorized" }, { status: err.status });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
