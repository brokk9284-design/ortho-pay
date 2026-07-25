import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { getOrCreateChat, addSystemMessage } from "@/lib/chat";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: requestId } = await params;
    const body = await request.json();
    const { action } = body;

    if (!action || !["accept", "decline", "cancel"].includes(action)) {
      return NextResponse.json(
        { error: "action must be 'accept', 'decline', or 'cancel'" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const admin = await createSupabaseAdminClient();

    const { data: paymentRequest } = await admin
      .from("payment_requests")
      .select("*")
      .eq("request_id", requestId)
      .single();

    if (!paymentRequest) {
      return NextResponse.json({ error: "Payment request not found" }, { status: 404 });
    }

    if (action === "cancel") {
      if (paymentRequest.requester_id !== user.id) {
        return NextResponse.json(
          { error: "Only the requester can cancel this request" },
          { status: 403 }
        );
      }
      if (paymentRequest.status !== "pending" && paymentRequest.status !== "accepted") {
        return NextResponse.json(
          { error: `Request is already ${paymentRequest.status}` },
          { status: 400 }
        );
      }
    } else {
      if (paymentRequest.requested_from_id !== user.id) {
        return NextResponse.json(
          { error: "Only the requested user can accept or decline this request" },
          { status: 403 }
        );
      }
      if (paymentRequest.status !== "pending") {
        return NextResponse.json(
          { error: `Request is already ${paymentRequest.status}` },
          { status: 400 }
        );
      }
    }

    const newStatus = action === "accept" ? "accepted" : action === "decline" ? "declined" : "cancelled";

    await admin
      .from("payment_requests")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("request_id", requestId);

    const { data: requesterProfile } = await admin
      .from("profiles")
      .select("siva_tag, name")
      .eq("id", paymentRequest.requester_id)
      .single();

    const { data: requestedFromProfile } = await admin
      .from("profiles")
      .select("siva_tag, name")
      .eq("id", paymentRequest.requested_from_id)
      .single();

    const chatId = await getOrCreateChat(
      paymentRequest.requester_id,
      paymentRequest.requested_from_id
    );

    if (action === "accept") {
      await addSystemMessage(
        chatId,
        `$${requestedFromProfile?.siva_tag || "user"} accepted the payment request of $${paymentRequest.amount.toFixed(2)} from $${requesterProfile?.siva_tag || "user"}.`,
        "request_accepted",
        { paymentRequestId: requestId }
      );

      await admin.from("notifications").insert({
        user_id: paymentRequest.requester_id,
        title: "Payment request accepted",
        message: `$${requestedFromProfile?.siva_tag || "User"} accepted your request for $${paymentRequest.amount.toFixed(2)}.`,
        type: "payment",
      });
    } else if (action === "decline") {
      await addSystemMessage(
        chatId,
        `$${requestedFromProfile?.siva_tag || "user"} declined the payment request of $${paymentRequest.amount.toFixed(2)} from $${requesterProfile?.siva_tag || "user"}.`,
        "request_declined",
        { paymentRequestId: requestId }
      );

      await admin.from("notifications").insert({
        user_id: paymentRequest.requester_id,
        title: "Payment request declined",
        message: `$${requestedFromProfile?.siva_tag || "User"} declined your request for $${paymentRequest.amount.toFixed(2)}.`,
        type: "payment",
      });
    } else {
      await addSystemMessage(
        chatId,
        `$${requesterProfile?.siva_tag || "user"} cancelled the payment request of $${paymentRequest.amount.toFixed(2)} to $${requestedFromProfile?.siva_tag || "user"}.`,
        "request_cancelled",
        { paymentRequestId: requestId }
      );

      await admin.from("notifications").insert({
        user_id: paymentRequest.requested_from_id,
        title: "Payment request cancelled",
        message: `$${requesterProfile?.siva_tag || "User"} cancelled their request for $${paymentRequest.amount.toFixed(2)}.`,
        type: "payment",
      });
    }

    return NextResponse.json({
      status: newStatus,
      request_id: requestId,
      chat_id: chatId,
    });
  } catch (err) {
    if (err instanceof Response) {
      return NextResponse.json({ error: "Unauthorized" }, { status: err.status });
    }
    return NextResponse.json({ error: "Failed to update payment request" }, { status: 500 });
  }
}
