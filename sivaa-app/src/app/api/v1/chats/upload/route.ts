import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { uploadFile, isStorageConfigured } from "@/lib/github-storage";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    if (!isStorageConfigured()) {
      return NextResponse.json({ error: "File storage is not configured" }, { status: 503 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const chatId = formData.get("chat_id") as string | null;
    const paymentId = formData.get("payment_id") as string | null;

    if (!file || !chatId) {
      return NextResponse.json({ error: "file and chat_id are required" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

    const { data: chat } = await supabase
      .from("transaction_chats")
      .select("user_a_id, user_b_id")
      .eq("chat_id", chatId)
      .single();

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    if (chat.user_a_id !== user.id && chat.user_b_id !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const filename = `chat_${chatId}_${Date.now()}_${file.name}`;

    const result = await uploadFile(
      user.id,
      "chat-files",
      file.name,
      fileBuffer,
      filename
    );

    const { data: message, error } = await supabase
      .from("transaction_messages")
      .insert({
        chat_id: chatId,
        sender_id: user.id,
        message_type: "file",
        body: null,
        file_url: result.path,
        file_name: file.name,
        file_size: file.size,
        payment_id: paymentId || null,
        read_by_a: chat.user_a_id === user.id,
        read_by_b: chat.user_b_id === user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase
      .from("transaction_chats")
      .update({ last_message_at: new Date().toISOString() })
      .eq("chat_id", chatId);

    const otherUserId = chat.user_a_id === user.id ? chat.user_b_id : chat.user_a_id;
    await supabase.from("notifications").insert({
      user_id: otherUserId,
      title: "New file in chat",
      message: `A file was shared in your transaction chat: ${file.name}`,
      type: "general",
    });

    return NextResponse.json({ message, file: { path: result.path, url: result.url, size: result.size } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    if (message.includes("not configured") || message.includes("not allowed") || message.includes("exceeds") || message.includes("Invalid")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
