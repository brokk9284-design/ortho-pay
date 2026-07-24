import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateChat, resolveSivaTag } from "@/lib/chat";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = await createSupabaseServerClient();

    const { data: chats, error } = await supabase
      .from("transaction_chats")
      .select(`
        chat_id,
        last_message_at,
        created_at,
        user_a:profiles!user_a_id(id, siva_tag, name, avatar_url),
        user_b:profiles!user_b_id(id, siva_tag, name, avatar_url)
      `)
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .order("last_message_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const chatIds = (chats || []).map((c: { chat_id: string }) => c.chat_id);
    let unreadCounts: Record<string, number> = {};

    if (chatIds.length > 0) {
      const { data: messages } = await supabase
        .from("transaction_messages")
        .select("chat_id, read_by_a, read_by_b")
        .in("chat_id", chatIds);

      if (messages) {
        for (const msg of messages) {
          const chat = chats!.find((c: { chat_id: string }) => c.chat_id === msg.chat_id) as { chat_id: string; user_a?: { id: string }[]; user_b?: { id: string }[] } | undefined;
          if (!chat) continue;
          const userAId = chat.user_a?.[0]?.id;
          const isUserA = userAId === user.id;
          const isUnread = isUserA ? !msg.read_by_a : !msg.read_by_b;
          if (isUnread) {
            unreadCounts[msg.chat_id] = (unreadCounts[msg.chat_id] || 0) + 1;
          }
        }
      }
    }

    return NextResponse.json({ chats, unreadCounts });
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
    const { siva_tag } = body;

    if (!siva_tag) {
      return NextResponse.json({ error: "siva_tag is required" }, { status: 400 });
    }

    const targetProfile = await resolveSivaTag(siva_tag);

    if (!targetProfile) {
      return NextResponse.json({ error: `User $${siva_tag} not found` }, { status: 404 });
    }

    if (targetProfile.id === user.id) {
      return NextResponse.json({ error: "Cannot create a chat with yourself" }, { status: 400 });
    }

    const chatId = await getOrCreateChat(user.id, targetProfile.id);

    return NextResponse.json({
      chat_id: chatId,
      profile: targetProfile,
    });
  } catch (err) {
    if (err instanceof Response) {
      return NextResponse.json({ error: "Unauthorized" }, { status: err.status });
    }
    return NextResponse.json({ error: "Failed to resolve chat" }, { status: 500 });
  }
}
