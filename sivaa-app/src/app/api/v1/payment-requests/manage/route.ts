import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { getOrCreateChat, addSystemMessage } from "@/lib/chat";

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { request_id, action, fulfilled_payment_id } = body;

    if (!request_id || !action) {
      return NextResponse.json({ error: "request_id and action are required" }, { status: 400 });
    }

    if (!["fulfill", "cancel", "decline"].includes(action)) {
      return NextResponse.json({ error: "action must be 'fulfill', 'cancel', or 'decline'" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

    const { data: paymentRequest, error: fetchError } = await supabase
      .from("payment_requests")
      .select("*")
      .eq("request_id", request_id)
      .single();

    if (fetchError || !paymentRequest) {
      return NextResponse.json({ error: "Payment request not found" }, { status: 404 });
    }

    if (paymentRequest.status !== "pending") {
      return NextResponse.json({ error: `Request is already ${paymentRequest.status}` }, { status: 400 });
    }

    if (action === "cancel") {
      if (paymentRequest.requester_id !== user.id) {
        return NextResponse.json({ error: "Only the requester can cancel" }, { status: 403 });
      }

      await supabase
        .from("payment_requests")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("request_id", request_id);

      await supabase.from("notifications").insert({
        user_id: paymentRequest.requested_from_id,
        title: "Payment request cancelled",
        message: "A payment request sent to you has been cancelled by the requester.",
        type: "payment",
      });

      // Post system message to chat
      const chatId = await getOrCreateChat(paymentRequest.requester_id, paymentRequest.requested_from_id);
      await addSystemMessage(
        chatId,
        `Payment request cancelled by requester.`,
        "request_cancelled",
        { paymentRequestId: request_id }
      );

      return NextResponse.json({ message: "Payment request cancelled" });
    }

    if (action === "decline") {
      if (paymentRequest.requested_from_id !== user.id) {
        return NextResponse.json({ error: "Only the requested user can decline" }, { status: 403 });
      }

      await supabase
        .from("payment_requests")
        .update({ status: "declined", updated_at: new Date().toISOString() })
        .eq("request_id", request_id);

      await supabase.from("notifications").insert({
        user_id: paymentRequest.requester_id,
        title: "Payment request declined",
        message: "Your payment request has been declined.",
        type: "payment",
      });

      // Post system message to chat
      const chatId = await getOrCreateChat(paymentRequest.requester_id, paymentRequest.requested_from_id);
      await addSystemMessage(
        chatId,
        `Payment request declined by $${paymentRequest.requested_from_id === user.id ? "requested user" : "user"}.`,
        "request_declined",
        { paymentRequestId: request_id }
      );

      return NextResponse.json({ message: "Payment request declined" });
    }

    if (action === "fulfill") {
      if (paymentRequest.requested_from_id !== user.id) {
        return NextResponse.json({ error: "Only the requested user can fulfill this request" }, { status: 403 });
      }

      if (!fulfilled_payment_id) {
        return NextResponse.json({ error: "fulfilled_payment_id is required to fulfill" }, { status: 400 });
      }

      await supabase
        .from("payment_requests")
        .update({
          status: "fulfilled",
          fulfilled_payment_id,
          updated_at: new Date().toISOString(),
        })
        .eq("request_id", request_id);

      await supabase.from("notifications").insert({
        user_id: paymentRequest.requester_id,
        title: "Payment request fulfilled",
        message: "Your payment request has been fulfilled. The payment is now in escrow.",
        type: "payment",
      });

      // Post system message to chat
      const chatId = await getOrCreateChat(paymentRequest.requester_id, paymentRequest.requested_from_id);
      await addSystemMessage(
        chatId,
        `Payment request fulfilled — payment is now in escrow.`,
        "request_fulfilled",
        { paymentRequestId: request_id, paymentId: fulfilled_payment_id }
      );

      return NextResponse.json({ message: "Payment request fulfilled" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    if (err instanceof Response) {
      return NextResponse.json({ error: "Unauthorized" }, { status: err.status });
    }
    return NextResponse.json({ error: "Failed to update payment request" }, { status: 500 });
  }
}
