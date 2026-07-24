import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { api } from "@/lib/api";
import { theme } from "@/lib/theme";

interface Message {
  message_id: string;
  sender_id: string;
  message_type: "user" | "system" | "file";
  body: string | null;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  event_type: string | null;
  created_at: string;
}

export default function ChatConversationScreen() {
  const { chat_id } = useLocalSearchParams<{ chat_id: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [otherName, setOtherName] = useState("User");
  const [otherTag, setOtherTag] = useState("unknown");
  const [currentUserId, setCurrentUserId] = useState("");
  const flatListRef = useRef<FlatList>(null);

  const fetchMessages = useCallback(async () => {
    if (!chat_id) return;
    try {
      const data = await api.chats.messages(chat_id);
      setMessages((data.messages || []) as Message[]);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [chat_id]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  const handleSend = async () => {
    if (!input.trim() || sending || !chat_id) return;
    setSending(true);
    try {
      await api.chats.sendMessage(chat_id, input.trim());
      setInput("");
      await fetchMessages();
    } catch {
      // silent
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async () => {
    if (!chat_id) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const file = result.assets[0];
      setUploading(true);
      await api.chats.uploadFile(chat_id, {
        uri: file.uri,
        type: file.mimeType || "image/jpeg",
        name: file.fileName || "upload.jpg",
      });
      await fetchMessages();
    } catch {
      // silent
    } finally {
      setUploading(false);
    }
  };

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return "Today";
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const isMyMessage = (msg: Message) => msg.sender_id === currentUserId;
  let lastDate = "";

  const renderMessage = ({ item: msg }: { item: Message }) => {
    const msgDate = formatDate(msg.created_at);
    const showDivider = msgDate !== lastDate;
    lastDate = msgDate;

    if (msg.message_type === "system") {
      return (
        <View>
          {showDivider && <DateDivider date={msgDate} />}
          <View style={styles.systemMessage}>
            <Text style={styles.systemText}>{msg.body}</Text>
            {msg.event_type && (
              <Text style={styles.systemEventType}>{msg.event_type.replace(/_/g, " ")}</Text>
            )}
          </View>
        </View>
      );
    }

    const mine = isMyMessage(msg);

    return (
      <View>
        {showDivider && <DateDivider date={msgDate} />}
        <View style={[styles.messageRow, mine ? styles.messageRowMine : styles.messageRowOther]}>
          <View style={[styles.messageBubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
            {msg.message_type === "file" ? (
              <View style={styles.fileContainer}>
                <Text style={styles.fileIcon}>📎</Text>
                <View>
                  <Text style={[styles.fileName, mine ? { color: theme.colors.primaryText } : { color: theme.colors.ink }]}>
                    {msg.file_name || "File"}
                  </Text>
                  {msg.file_size != null && (
                    <Text style={[styles.fileSize, mine ? { color: "rgba(255,255,255,0.5)" } : { color: theme.colors.charcoal }]}>
                      {(msg.file_size / 1024).toFixed(1)} KB
                    </Text>
                  )}
                </View>
              </View>
            ) : (
              <Text style={[styles.messageText, mine ? { color: theme.colors.primaryText } : { color: theme.colors.ink }]}>
                {msg.body}
              </Text>
            )}
            <Text style={[styles.messageTime, mine ? { color: "rgba(255,255,255,0.5)" } : { color: theme.colors.charcoal }]}>
              {formatTime(msg.created_at)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={styles.headerName}>{otherName}</Text>
            <Text style={styles.headerTag}>${otherTag}</Text>
          </View>
          <View style={{ width: 48 }} />
        </View>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={theme.colors.ink} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={styles.headerName}>{otherName}</Text>
          <Text style={styles.headerTag}>${otherTag}</Text>
        </View>
        <View style={{ width: 48 }} />
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.message_id}
        renderItem={renderMessage}
        contentContainerStyle={{ paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.md }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 60 }}>
            <Text style={{ color: theme.colors.charcoal, fontSize: 14 }}>No messages yet. Start the conversation.</Text>
          </View>
        }
      />

      <View style={styles.inputBar}>
        <TouchableOpacity onPress={handleFileUpload} style={styles.attachButton} disabled={uploading}>
          <Text style={styles.attachIcon}>{uploading ? "⏳" : "📎"}</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.textInput}
          value={input}
          onChangeText={setInput}
          placeholder="Type a message..."
          placeholderTextColor={theme.colors.mute}
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!input.trim() || sending) && { opacity: 0.5 }]}
          onPress={handleSend}
          disabled={!input.trim() || sending}
        >
          <Text style={styles.sendButtonText}>{sending ? "..." : "Send"}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function DateDivider({ date }: { date: string }) {
  return (
    <View style={styles.dateDivider}>
      <View style={styles.dateDividerBadge}>
        <Text style={styles.dateDividerText}>{date}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.canvas },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
    paddingTop: 56,
    paddingBottom: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.hairline,
  },
  backButton: { fontSize: 14, color: theme.colors.charcoal },
  headerName: { fontSize: 14, fontWeight: "600", color: theme.colors.ink },
  headerTag: { fontSize: 11, color: theme.colors.charcoal },
  messageRow: { flexDirection: "row", marginBottom: 4 },
  messageRowMine: { justifyContent: "flex-end" },
  messageRowOther: { justifyContent: "flex-start" },
  messageBubble: {
    maxWidth: "75%",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  bubbleMine: { backgroundColor: theme.colors.ink },
  bubbleOther: { backgroundColor: theme.colors.surfaceSoft, borderWidth: 1, borderColor: theme.colors.hairline },
  messageText: { fontSize: 14 },
  messageTime: { fontSize: 10, marginTop: 2 },
  fileContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
  fileIcon: { fontSize: 18 },
  fileName: { fontSize: 14, fontWeight: "500" },
  fileSize: { fontSize: 11 },
  systemMessage: {
    alignItems: "center",
    marginVertical: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
    maxWidth: "85%",
    alignSelf: "center",
  },
  systemText: { fontSize: 12, color: theme.colors.charcoal, textAlign: "center" },
  systemEventType: { fontSize: 9, textTransform: "uppercase", color: theme.colors.mute, marginTop: 2 },
  dateDivider: { flexDirection: "row", justifyContent: "center", marginVertical: 12 },
  dateDividerBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceSoft,
  },
  dateDividerText: { fontSize: 11, color: theme.colors.charcoal },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.hairline,
  },
  attachButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.canvas,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
    justifyContent: "center",
    alignItems: "center",
  },
  attachIcon: { fontSize: 16 },
  textInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.canvas,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
    fontSize: 14,
    color: theme.colors.ink,
  },
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.ink,
  },
  sendButtonText: { color: theme.colors.primaryText, fontSize: 14, fontWeight: "600" },
});
