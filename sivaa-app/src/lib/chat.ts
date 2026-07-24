import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getOrCreateChat(userAId: string, userBId: string) {
  const supabase = await createSupabaseServerClient();

  const [a, b] = userAId < userBId ? [userAId, userBId] : [userBId, userAId];

  const { data: existing } = await supabase
    .from("transaction_chats")
    .select("chat_id")
    .eq("user_a_id", a)
    .eq("user_b_id", b)
    .maybeSingle();

  if (existing) {
    return existing.chat_id;
  }

  const { data: chat, error } = await supabase
    .from("transaction_chats")
    .insert({ user_a_id: a, user_b_id: b })
    .select("chat_id")
    .single();

  if (error) {
    const { data: retry } = await supabase
      .from("transaction_chats")
      .select("chat_id")
      .eq("user_a_id", a)
      .eq("user_b_id", b)
      .single();
    return retry?.chat_id;
  }

  return chat.chat_id;
}

export async function addSystemMessage(
  chatId: string,
  body: string,
  eventType: string,
  options?: {
    paymentId?: string;
    paymentRequestId?: string;
  }
) {
  const supabase = await createSupabaseServerClient();

  const { data: chat } = await supabase
    .from("transaction_chats")
    .select("user_a_id, user_b_id")
    .eq("chat_id", chatId)
    .single();

  if (!chat) return;

  const senderId = options?.paymentId
    ? null
    : chat.user_a_id;

  await supabase.from("transaction_messages").insert({
    chat_id: chatId,
    sender_id: senderId,
    message_type: "system",
    body,
    event_type: eventType,
    payment_id: options?.paymentId || null,
    payment_request_id: options?.paymentRequestId || null,
    read_by_a: false,
    read_by_b: false,
  });

  await supabase
    .from("transaction_chats")
    .update({ last_message_at: new Date().toISOString() })
    .eq("chat_id", chatId);
}

export async function resolveSivaTag(sivaTag: string) {
  const supabase = await createSupabaseServerClient();

  const cleanTag = sivaTag.toLowerCase().replace(/^\$/, "").replace(/[^a-z0-9_]/g, "");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, siva_tag, name, avatar_url, kyc_status")
    .eq("siva_tag", cleanTag)
    .single();

  return profile;
}
