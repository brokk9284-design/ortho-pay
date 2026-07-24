import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = await createSupabaseServerClient();

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chat_id");
    const limit = parseInt(searchParams.get("limit") || "100");
    const before = searchParams.get("before");

    if (!chatId) {
      return NextResponse.json({ error: "chat_id is required" }, { status: 400 });
    }

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

    let query = supabase
      .from("transaction_messages")
      .select(`
        message_id,
        sender_id,
        message_type,
        body,
        file_url,
        file_name,
        file_size,
        payment_id,
        payment_request_id,
        event_type,
        read_by_a,
        read_by_b,
        created_at
      `)
      .eq("chat_id", chatId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt("created_at", before);
    }

    const { data: messages, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const isUserA = chat.user_a_id === user.id;
    const readField = isUserA ? "read_by_a" : "read_by_b";
    const messageIds = (messages || [])
      .filter((m: { [key: string]: unknown }) => !(m as Record<string, boolean>)[readField])
      .map((m: { message_id: string }) => m.message_id);

    if (messageIds.length > 0) {
      await supabase
        .from("transaction_messages")
        .update({ [readField]: true })
        .in("message_id", messageIds);
    }

    return NextResponse.json({ messages: (messages || []).reverse() });
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
    const { chat_id, body: messageBody } = body;

    if (!chat_id || !messageBody) {
      return NextResponse.json({ error: "chat_id and body are required" }, { status: 400 });
    }

    if (typeof messageBody !== "string" || messageBody.trim().length === 0) {
      return NextResponse.json({ error: "Message body cannot be empty" }, { status: 400 });
    }

    if (messageBody.length > 2000) {
      return NextResponse.json({ error: "Message too long (max 2000 characters)" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

    const { data: chat } = await supabase
      .from("transaction_chats")
      .select("user_a_id, user_b_id")
      .eq("chat_id", chat_id)
      .single();

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    if (chat.user_a_id !== user.id && chat.user_b_id !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { data: message, error } = await supabase
      .from("transaction_messages")
      .insert({
        chat_id,
        sender_id: user.id,
        message_type: "user",
        body: messageBody.trim(),
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
      .eq("chat_id", chat_id);

    const otherUserId = chat.user_a_id === user.id ? chat.user_b_id : chat.user_a_id;
    await supabase.from("notifications").insert({
      user_id: otherUserId,
      title: "New message",
      message: `You have a new message in your transaction chat.`,
      type: "general",
    });

    return NextResponse.json({ message });
  } catch (err) {
    if (err instanceof Response) {
      return NextResponse.json({ error: "Unauthorized" }, { status: err.status });
    }
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
