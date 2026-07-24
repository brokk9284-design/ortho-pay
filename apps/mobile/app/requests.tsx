import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { api } from "@/lib/api";
import { theme } from "@/lib/theme";

interface PaymentRequest {
  request_id: string;
  requester_id: string;
  receiver_id: string;
  amount: number;
  status: string;
  message: string | null;
  created_at: string;
  payment_method_id: string;
  requester?: { siva_tag: string; name: string };
  receiver?: { siva_tag: string; name: string };
  payment_method?: { display_name: string };
}

export default function PaymentRequestsScreen() {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"incoming" | "outgoing" | "all">("incoming");
  const [acting, setActing] = useState("");

  const fetchRequests = useCallback(async () => {
    try {
      const data = await api.paymentRequests.list();
      const r = data as { requests: PaymentRequest[] };
      setRequests(r.requests || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 15000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  const handleAction = async (requestId: string, action: "fulfill" | "decline") => {
    setActing(requestId + action);
    try {
      if (action === "fulfill") {
        const req = requests.find((r) => r.request_id === requestId);
        if (req) {
          router.push(`/2fa?purpose=send_payment&counterparty=${req.requester?.siva_tag}&amount=${req.amount}&method=${req.payment_method_id}`);
        }
      } else {
        await api.paymentRequests.manage(requestId, "decline");
        await fetchRequests();
      }
    } catch {
      // silent
    } finally {
      setActing("");
    }
  };

  const handleCancel = async (requestId: string) => {
    setActing(requestId + "cancel");
    try {
      await api.paymentRequests.manage(requestId, "cancel");
      await fetchRequests();
    } catch {
      // silent
    } finally {
      setActing("");
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const getStatusColor = (status: string) => {
    if (status === "fulfilled") return theme.colors.terminalGreen;
    if (status === "pending") return theme.colors.terminalYellow;
    if (status === "declined" || status === "cancelled") return theme.colors.terminalRed;
    return theme.colors.charcoal;
  };

  const renderItem = ({ item }: { item: PaymentRequest }) => {
    const isIncoming = item.receiver_id !== item.requester_id;
    const otherUser = isIncoming ? item.requester : item.receiver;
    const isPending = item.status === "pending";

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{otherUser?.name?.charAt(0).toUpperCase() || "?"}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardName}>{otherUser?.name || "Unknown"}</Text>
            <Text style={styles.cardTag}>${otherUser?.siva_tag || "unknown"}</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>{isIncoming ? "Requesting" : "You requested"}</Text>
            <Text style={styles.amountValue}>${item.amount.toFixed(2)}</Text>
          </View>
          {item.payment_method && (
            <Text style={styles.methodText}>via {item.payment_method.display_name}</Text>
          )}
          {item.message && (
            <Text style={styles.messageText}>"{item.message}"</Text>
          )}
          <Text style={styles.timeText}>{formatTime(item.created_at)}</Text>
        </View>

        {isPending && (
          <View style={styles.cardActions}>
            {isIncoming ? (
              <>
                <TouchableOpacity
                  style={styles.fulfillButton}
                  onPress={() => handleAction(item.request_id, "fulfill")}
                  disabled={acting === item.request_id + "fulfill"}
                >
                  {acting === item.request_id + "fulfill" ? (
                    <ActivityIndicator size="small" color={theme.colors.primaryText} />
                  ) : (
                    <Text style={styles.fulfillText}>Pay Now</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.declineButton}
                  onPress={() => handleAction(item.request_id, "decline")}
                  disabled={acting === item.request_id + "decline"}
                >
                  <Text style={styles.declineText}>Decline</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => handleCancel(item.request_id)}
                disabled={acting === item.request_id + "cancel"}
              >
                {acting === item.request_id + "cancel" ? (
                  <ActivityIndicator size="small" color={theme.colors.terminalRed} />
                ) : (
                  <Text style={styles.cancelText}>Cancel Request</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
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
          <Text style={styles.headerTitle}>Payment Requests</Text>
          <View style={{ width: 48 }} />
        </View>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={theme.colors.ink} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Requests</Text>
        <View style={{ width: 48 }} />
      </View>

      <View style={styles.filterRow}>
        {(["incoming", "outgoing", "all"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[
              styles.filterButton,
              filter === f && { backgroundColor: theme.colors.ink },
            ]}
          >
            <Text style={[styles.filterText, filter === f && { color: theme.colors.primaryText }]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={requests}
        keyExtractor={(item) => item.request_id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchRequests(); }} tintColor={theme.colors.ink} />}
        contentContainerStyle={{ paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.lg }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 32, marginBottom: 12 }}>📋</Text>
            <Text style={{ color: theme.colors.ink, fontSize: 14, fontWeight: "600" }}>No requests</Text>
            <Text style={{ color: theme.colors.charcoal, fontSize: 12, marginTop: 4 }}>
              Payment requests will appear here
            </Text>
          </View>
        }
      />
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
  headerTitle: { fontSize: 16, fontWeight: "700", color: theme.colors.ink },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.hairline,
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
  },
  filterText: { fontSize: 12, fontWeight: "600", color: theme.colors.charcoal },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.ink,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: theme.colors.primaryText, fontSize: 14, fontWeight: "700" },
  cardName: { fontSize: 14, fontWeight: "600", color: theme.colors.ink },
  cardTag: { fontSize: 12, color: theme.colors.charcoal },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: theme.radius.full, backgroundColor: theme.colors.surfaceSoft },
  statusText: { fontSize: 10, fontWeight: "600" },
  cardBody: { marginBottom: 8 },
  amountRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  amountLabel: { fontSize: 12, color: theme.colors.charcoal },
  amountValue: { fontSize: 18, fontWeight: "700", fontFamily: "monospace", color: theme.colors.ink },
  methodText: { fontSize: 12, color: theme.colors.charcoal, marginBottom: 4 },
  messageText: { fontSize: 13, color: theme.colors.body, fontStyle: "italic", marginBottom: 4 },
  timeText: { fontSize: 11, color: theme.colors.mute },
  cardActions: { flexDirection: "row", gap: 8, marginTop: 8 },
  fulfillButton: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: theme.colors.ink,
    justifyContent: "center",
    alignItems: "center",
  },
  fulfillText: { color: theme.colors.primaryText, fontSize: 14, fontWeight: "600" },
  declineButton: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "rgba(239,68,68,0.1)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  declineText: { color: theme.colors.terminalRed, fontSize: 14, fontWeight: "600" },
  cancelButton: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(239,68,68,0.1)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  cancelText: { color: theme.colors.terminalRed, fontSize: 14, fontWeight: "600" },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 80 },
});
