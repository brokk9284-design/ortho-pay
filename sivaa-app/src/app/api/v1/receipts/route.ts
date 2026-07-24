import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { uploadFile, buildReceiptFilename, isStorageConfigured } from "@/lib/github-storage";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    if (!isStorageConfigured()) {
      return NextResponse.json(
        { error: "File storage is not configured. Contact support." },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const paymentId = formData.get("payment_id") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!paymentId) {
      return NextResponse.json({ error: "payment_id is required" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

    // Verify the payment belongs to the user (sender or receiver)
    const { data: payment } = await supabase
      .from("payments")
      .select("payment_id, sender_id, receiver_id, reference, status")
      .eq("payment_id", paymentId)
      .single();

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.sender_id !== user.id && payment.receiver_id !== user.id) {
      return NextResponse.json({ error: "You can only upload receipts for your own payments" }, { status: 403 });
    }

    if (payment.status !== "escrow_held" && payment.status !== "under_review") {
      return NextResponse.json(
        { error: `Receipts can only be uploaded for payments in escrow. This payment is ${payment.status}.` },
        { status: 400 }
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const filename = buildReceiptFilename(payment.reference, file.name);

    const result = await uploadFile(
      user.id,
      "receipts",
      file.name,
      fileBuffer,
      filename
    );

    // Store receipt in payment_verifications table
    const { data: verification, error } = await supabase
      .from("payment_verifications")
      .insert({
        payment_id: paymentId,
        verification_method: "manual_receipt",
        receipt_url: result.path,
        verified: false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Notify the other party that a receipt was uploaded
    const otherUserId = payment.sender_id === user.id ? payment.receiver_id : payment.sender_id;
    await supabase.from("notifications").insert({
      user_id: otherUserId,
      title: "Receipt uploaded",
      message: `A receipt for payment ${payment.reference} has been uploaded.`,
      type: "escrow",
    });

    // Post system message to transaction chat
    const { getOrCreateChat, addSystemMessage } = await import("@/lib/chat");
    const chatId = await getOrCreateChat(payment.sender_id, payment.receiver_id);
    await addSystemMessage(
      chatId,
      `Receipt uploaded: ${file.name} for payment ${payment.reference}.`,
      "receipt_uploaded",
      { paymentId: paymentId }
    );

    return NextResponse.json({
      verification,
      file: {
        path: result.path,
        url: result.url,
        size: result.size,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    if (message.includes("not configured")) {
      return NextResponse.json({ error: message }, { status: 503 });
    }
    if (message.includes("not allowed") || message.includes("exceeds") || message.includes("Invalid")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get("payment_id");
    const all = searchParams.get("all");

    const supabase = await createSupabaseServerClient();

    // Check if user is admin
    let isAdmin = false;
    try {
      await requireAdmin();
      isAdmin = true;
    } catch {
      isAdmin = false;
    }

    // Admin can fetch all receipts
    if (all === "true" && isAdmin) {
      const { data: verifications, error } = await supabase
        .from("payment_verifications")
        .select(`
          *,
          payment:payments(reference, gross_amount, sender_id, receiver_id)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ verifications });
    }

    if (!paymentId) {
      return NextResponse.json({ error: "payment_id is required" }, { status: 400 });
    }

    // Verify the payment belongs to the user or user is admin
    if (!isAdmin) {
      const { data: payment } = await supabase
        .from("payments")
        .select("sender_id, receiver_id")
        .eq("payment_id", paymentId)
        .single();

      if (!payment) {
        return NextResponse.json({ error: "Payment not found" }, { status: 404 });
      }

      if (payment.sender_id !== user.id && payment.receiver_id !== user.id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    const { data: verifications, error } = await supabase
      .from("payment_verifications")
      .select("*")
      .eq("payment_id", paymentId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ verifications });
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
