import { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet } from "react-native";
import { router } from "expo-router";
import { api } from "@/lib/api";
import { theme } from "@/lib/theme";

interface ChatItem {
  chat_id: string;
  last_message_at: string;
  created_at: string;
  user_a: { id: string; siva_tag: string; name: string; avatar_url: string | null }[];
  user_b: { id: string; siva_tag: string; name: string; avatar_url: string | null }[];
}

export default function ChatListScreen() {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [error, setError] = useState("");
  const [resolving, setResolving] = useState(false);

  const fetchChats = useCallback(async () => {
    try {
      const data = await api.chats.list();
      setChats((data.chats || []) as ChatItem[]);
      setUnreadCounts(data.unreadCounts || {});
    } catch {
      setError("Failed to load chats");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchChats();
    const interval = setInterval(fetchChats, 10000);
    return () => clearInterval(interval);
  }, [fetchChats]);

  const handleResolve = async () => {
    if (!tagInput.trim()) return;
    setResolving(true);
    setError("");
    try {
      const data = await api.chats.resolve(tagInput.trim());
      router.push(`/chat/${data.chat_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "User not found");
    } finally {
      setResolving(false);
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = diff / (1000 * 60 * 60);
    if (hours < 24) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const days = hours / 24;
    if (days < 7) return d.toLocaleDateString([], { weekday: "short" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const renderChat = ({ item }: { item: ChatItem }) => {
    const other = item.user_a?.[0] || item.user_b?.[0];
    const unread = unreadCounts[item.chat_id] || 0;
    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => router.push(`/chat/${item.chat_id}`)}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{other?.name?.charAt(0).toUpperCase() || "?"}</Text>
        </View>
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName} numberOfLines={1}>{other?.name || "Unknown"}</Text>
            <Text style={styles.chatTime}>{formatTime(item.last_message_at || item.created_at)}</Text>
          </View>
          <View style={styles.chatFooter}>
            <Text style={styles.chatTag}>${other?.siva_tag || "unknown"}</Text>
            {unread > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unread}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chats</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={{ color: theme.colors.charcoal, fontSize: 14 }}>Loading chats...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats</Text>
        <TouchableOpacity onPress={() => setShowNew(!showNew)} style={styles.newButton}>
          <Text style={styles.newButtonText}>New</Text>
        </TouchableOpacity>
      </View>

      {showNew && (
        <View style={styles.newChatContainer}>
          <Text style={styles.inputLabel}>Enter ORTHO Tag</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={tagInput}
              onChangeText={setTagInput}
              placeholder="$alice"
              placeholderTextColor={theme.colors.mute}
              onSubmitEditing={handleResolve}
            />
            <TouchableOpacity
              style={[styles.startButton, (!tagInput.trim() || resolving) && { opacity: 0.5 }]}
              onPress={handleResolve}
              disabled={!tagInput.trim() || resolving}
            >
              <Text style={styles.startButtonText}>{resolving ? "..." : "Start"}</Text>
            </TouchableOpacity>
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      )}

      <FlatList
        data={chats}
        keyExtractor={(item) => item.chat_id}
        renderItem={renderChat}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchChats(); }} tintColor={theme.colors.ink} />}
        contentContainerStyle={chats.length === 0 ? { flex: 1, justifyContent: "center", alignItems: "center" } : { paddingHorizontal: theme.spacing.md }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 32, marginBottom: 12 }}>💬</Text>
            <Text style={{ color: theme.colors.ink, fontSize: 14, fontWeight: "600" }}>No chats yet</Text>
            <Text style={{ color: theme.colors.charcoal, fontSize: 12, marginTop: 4 }}>Enter a ORTHO tag to start</Text>
          </View>
        }
      />
    </View>
  );
}

import { TextInput } from "react-native";

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
  headerTitle: { fontSize: 20, fontWeight: "700", color: theme.colors.ink },
  newButton: {
    backgroundColor: theme.colors.ink,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
  },
  newButtonText: { color: theme.colors.primaryText, fontSize: 12, fontWeight: "600" },
  newChatContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceSoft,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.hairline,
  },
  inputLabel: { fontSize: 10, fontWeight: "600", textTransform: "uppercase", color: theme.colors.charcoal, marginBottom: 4 },
  inputRow: { flexDirection: "row", gap: 8 },
  textInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.canvas,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
    fontSize: 14,
    color: theme.colors.ink,
  },
  startButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.ink,
  },
  startButtonText: { color: theme.colors.primaryText, fontSize: 14, fontWeight: "600" },
  errorText: { color: theme.colors.terminalRed, fontSize: 12, marginTop: 4 },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    marginTop: 4,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.ink,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: theme.colors.primaryText, fontSize: 16, fontWeight: "700" },
  chatInfo: { flex: 1 },
  chatHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  chatName: { fontSize: 14, fontWeight: "600", color: theme.colors.ink, flex: 1 },
  chatTime: { fontSize: 11, color: theme.colors.charcoal, marginLeft: 8 },
  chatFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 2 },
  chatTag: { fontSize: 12, color: theme.colors.charcoal },
  badge: {
    backgroundColor: theme.colors.ink,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radius.full,
  },
  badgeText: { color: theme.colors.primaryText, fontSize: 10, fontWeight: "700" },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center" },
});
