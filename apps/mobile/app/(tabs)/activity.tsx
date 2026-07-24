import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { theme } from "@/lib/theme";

interface Payment {
  payment_id: string;
  gross_amount: number;
  fee_amount: number;
  net_amount: number;
  status: string;
  reference: string;
  created_at: string;
  sender?: { siva_tag: string };
  receiver?: { siva_tag: string };
}

const FILTERS = ["all", "sent", "received", "pending", "completed"];

export default function ActivityScreen() {
  const { user } = useAuthStore();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filter, setFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  const loadPayments = async () => {
    try {
      const data = await api.payments.list();
      setPayments((data as { payments: Payment[] }).payments || []);
    } catch {
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPayments();
    setRefreshing(false);
  };

  const isSender = (p: Payment) => p.sender?.siva_tag === user?.siva_tag;

  const filtered = payments.filter((p) => {
    if (filter === "all") return true;
    if (filter === "sent") return isSender(p);
    if (filter === "received") return !isSender(p);
    if (filter === "pending") return p.status === "pending" || p.status === "escrow_held";
    if (filter === "completed") return p.status === "completed";
    return true;
  });

  const getStatusColor = (status: string) => {
    if (status === "completed") return theme.colors.terminalGreen;
    if (status === "pending" || status === "escrow_held") return theme.colors.terminalYellow;
    return theme.colors.terminalRed;
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.canvas }}
      contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, paddingTop: 56, paddingBottom: 24 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.ink} />}
    >
      <Text style={styles.title}>Activity</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: filter === f ? theme.colors.ink : theme.colors.surface,
                borderWidth: 1,
                borderColor: filter === f ? theme.colors.ink : theme.colors.hairline,
              }}
            >
              <Text style={{
                fontSize: 12,
                fontWeight: "500",
                textTransform: "capitalize",
                color: filter === f ? theme.colors.primaryText : theme.colors.charcoal,
              }}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {filtered.length === 0 ? (
        <Text style={{ color: theme.colors.charcoal, fontSize: 13, textAlign: "center", paddingVertical: 32 }}>
          No transactions found
        </Text>
      ) : (
        filtered.map((p) => {
          const sent = isSender(p);
          const counterparty = sent ? p.receiver?.siva_tag : p.sender?.siva_tag;
          return (
            <View key={p.payment_id} style={styles.txnCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.txnTitle}>
                  {sent ? "Sent to" : "Received from"} ${counterparty || "?"}
                </Text>
                <Text style={styles.txnRef}>{p.reference}</Text>
                <Text style={styles.txnDate}>{new Date(p.created_at).toLocaleDateString()}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ fontSize: 16, fontWeight: "600", color: sent ? theme.colors.ink : theme.colors.terminalGreen }}>
                  {sent ? "-" : "+"}${p.gross_amount.toFixed(2)}
                </Text>
                <Text style={{ fontSize: 10, color: theme.colors.mute, marginTop: 2 }}>
                  Fee ${p.fee_amount.toFixed(2)}
                </Text>
                <Text style={{ fontSize: 10, fontWeight: "500", color: getStatusColor(p.status), marginTop: 2, textTransform: "capitalize" }}>
                  {p.status.replace(/_/g, " ")}
                </Text>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: "700", color: theme.colors.ink, marginBottom: 16 },
  txnCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  txnTitle: { fontSize: 14, fontWeight: "500", color: theme.colors.ink },
  txnRef: { fontSize: 11, color: theme.colors.mute, marginTop: 2, fontFamily: "monospace" },
  txnDate: { fontSize: 11, color: theme.colors.mute, marginTop: 2 },
});
