import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { sendPaymentRequestEmail } from "@/lib/email/service";
import { getOrCreateChat, addSystemMessage } from "@/lib/chat";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = await createSupabaseServerClient();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = supabase
      .from("payment_requests")
      .select(`
        *,
        requester:profiles!requester_id(siva_tag, name, avatar_url),
        requested_from:profiles!requested_from_id(siva_tag, name, avatar_url),
        payment_method:payment_methods(method_id, display_name, icon_key)
      `)
      .or(`requester_id.eq.${user.id},requested_from_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(50);

    if (status) {
      query = query.eq("status", status);
    }

    const { data: requests, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ requests });
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
    const { receiver_tag, amount, payment_method_id, message } = body;

    if (!receiver_tag || !amount) {
      return NextResponse.json(
        { error: "receiver_tag and amount are required" },
        { status: 400 }
      );
    }

    if (typeof amount !== "number" || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

    const { data: requesterProfile } = await supabase
      .from("profiles")
      .select("siva_tag, name, kyc_status")
      .eq("id", user.id)
      .single();

    if (!requesterProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (requesterProfile.kyc_status !== "verified") {
      return NextResponse.json(
        { error: "KYC verification required to request payments" },
        { status: 403 }
      );
    }

    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("id, siva_tag, name, email, kyc_status")
      .eq("siva_tag", receiver_tag.toLowerCase().replace(/^\$/, ""))
      .single();

    if (!targetProfile) {
      return NextResponse.json({ error: "User not found with that ORTHO tag" }, { status: 404 });
    }

    if (targetProfile.id === user.id) {
      return NextResponse.json({ error: "Cannot request payment from yourself" }, { status: 400 });
    }

    if (targetProfile.kyc_status !== "verified") {
      return NextResponse.json(
        { error: "Target user has not completed KYC verification" },
        { status: 403 }
      );
    }

    // Check for existing pending request between same pair to prevent duplicates
    const { data: existingRequest } = await supabase
      .from("payment_requests")
      .select("request_id")
      .eq("requester_id", user.id)
      .eq("requested_from_id", targetProfile.id)
      .eq("status", "pending")
      .limit(1)
      .maybeSingle();

    if (existingRequest) {
      return NextResponse.json(
        { error: "You already have a pending request to this user. Cancel it first before creating a new one." },
        { status: 409 }
      );
    }

    // Check both wallets are active (use admin client to bypass RLS)
    const admin = await createSupabaseAdminClient();
    const { data: requesterWallet } = await admin
      .from("wallets")
      .select("status")
      .eq("user_id", user.id)
      .single();
    const { data: targetWallet } = await admin
      .from("wallets")
      .select("status")
      .eq("user_id", targetProfile.id)
      .single();

    if (requesterWallet?.status !== "active") {
      return NextResponse.json({ error: "Your wallet is not active" }, { status: 403 });
    }
    if (targetWallet?.status !== "active") {
      return NextResponse.json({ error: "Target user's wallet is not active" }, { status: 403 });
    }

    let methodDisplayName = "Any method";
    if (payment_method_id) {
      const { data: method } = await supabase
        .from("payment_methods")
        .select("display_name, is_active")
        .eq("method_id", payment_method_id)
        .single();

      if (!method || !method.is_active) {
        return NextResponse.json({ error: "Payment method not available" }, { status: 400 });
      }
      methodDisplayName = method.display_name;
    }

    const { data: paymentRequest, error } = await supabase
      .from("payment_requests")
      .insert({
        requester_id: user.id,
        requested_from_id: targetProfile.id,
        amount,
        payment_method_id,
        message: message || null,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase.from("notifications").insert({
      user_id: targetProfile.id,
      title: `Payment request from $${requesterProfile.siva_tag}`,
      message: `${requesterProfile.name} is requesting $${amount.toFixed(2)} via ${methodDisplayName}. Tap to review and pay.`,
      type: "payment",
    });

    if (targetProfile.email) {
      await sendPaymentRequestEmail(
        targetProfile.email,
        targetProfile.name || "User",
        requesterProfile.siva_tag,
        requesterProfile.name || "An ORTHO-PAY user",
        amount,
        methodDisplayName
      );
    }

    // Auto-create transaction chat and post system message
    const chatId = await getOrCreateChat(user.id, targetProfile.id);
    await addSystemMessage(
      chatId,
      `Payment request: $${requesterProfile.siva_tag} is requesting $${amount.toFixed(2)} via ${methodDisplayName}.`,
      "request_created",
      { paymentRequestId: paymentRequest.request_id }
    );

    return NextResponse.json({ request: paymentRequest, chat_id: chatId });
  } catch (err) {
    if (err instanceof Response) {
      return NextResponse.json({ error: "Unauthorized" }, { status: err.status });
    }
    return NextResponse.json({ error: "Failed to create payment request" }, { status: 500 });
  }
}
