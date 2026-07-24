import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { theme } from "@/lib/theme";

interface Wallet {
  total_sent: number;
  total_received: number;
  locked_balance: number;
  status: string;
}

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

export default function HomeScreen() {
  const { user } = useAuthStore();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [quickTag, setQuickTag] = useState("");

  const loadData = async () => {
    try {
      const [walletData, paymentsData] = await Promise.all([
        api.wallet.get(),
        api.payments.list(),
      ]);
      setWallet(walletData as Wallet);
      setPayments((paymentsData as { payments: Payment[] }).payments?.slice(0, 5) || []);
    } catch {
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    if (status === "completed") return theme.colors.terminalGreen;
    if (status === "pending" || status === "escrow_held") return theme.colors.terminalYellow;
    return theme.colors.terminalRed;
  };

  const isSender = (p: Payment) => p.sender?.siva_tag === user?.siva_tag;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.canvas }}
      contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, paddingTop: 56, paddingBottom: 24 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.ink} />}
    >
      <Text style={styles.headerTitle}>ORTHO-PAY</Text>

      <View style={styles.identityCard}>
        <View>
          <Text style={styles.identityLabel}>Your SIVA Tag</Text>
          <Text style={styles.identityTag}>${user?.siva_tag || "..."}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Sent</Text>
          <Text style={styles.statValue}>${(wallet?.total_sent || 0).toFixed(2)}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Received</Text>
          <Text style={[styles.statValue, { color: theme.colors.terminalGreen }]}>
            ${(wallet?.total_received || 0).toFixed(2)}
          </Text>
        </View>
      </View>

      {(wallet?.locked_balance || 0) > 0 && (
        <View style={styles.escrowBanner}>
          <Text style={styles.escrowText}>
            ${(wallet?.locked_balance || 0).toFixed(2)} in escrow
          </Text>
        </View>
      )}

      <View style={styles.quickSend}>
        <Text style={styles.sectionTitle}>Quick Send</Text>
        <View style={styles.quickSendRow}>
          <View style={styles.tagInput}>
            <Text style={{ fontSize: 18, fontWeight: "600", color: theme.colors.charcoal }}>$</Text>
            <TextInput
              value={quickTag}
              onChangeText={setQuickTag}
              placeholder="recipient"
              placeholderTextColor={theme.colors.mute}
              autoCapitalize="none"
              style={{ flex: 1, fontSize: 16, color: theme.colors.ink, paddingHorizontal: 8 }}
            />
          </View>
          <TouchableOpacity
            onPress={() => router.push({ pathname: "/(tabs)/pay", params: { tag: quickTag } })}
            style={styles.sendButton}
          >
            <Text style={{ color: theme.colors.primaryText, fontSize: 14, fontWeight: "600" }}>Pay</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push("/chat")}>
          <Text style={styles.quickActionIcon}>💬</Text>
          <Text style={styles.quickActionLabel}>Chats</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push("/requests")}>
          <Text style={styles.quickActionIcon}>📋</Text>
          <Text style={styles.quickActionLabel}>Requests</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Recent Activity</Text>
      {payments.length === 0 ? (
        <Text style={{ color: theme.colors.charcoal, fontSize: 13, textAlign: "center", paddingVertical: 24 }}>
          No transactions yet
        </Text>
      ) : (
        payments.map((p) => {
          const sent = isSender(p);
          const counterparty = sent ? p.receiver?.siva_tag : p.sender?.siva_tag;
          return (
            <View key={p.payment_id} style={styles.txnRow}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "500", color: theme.colors.ink }}>
                  {sent ? "Sent to" : "Received from"} ${counterparty || "?"}
                </Text>
                <Text style={{ fontSize: 11, color: theme.colors.mute, marginTop: 2 }}>
                  {new Date(p.created_at).toLocaleDateString()}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: sent ? theme.colors.ink : theme.colors.terminalGreen }}>
                  {sent ? "-" : "+"}${p.gross_amount.toFixed(2)}
                </Text>
                <Text style={{ fontSize: 10, color: getStatusColor(p.status), marginTop: 2 }}>
                  {p.status}
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
  headerTitle: { fontSize: 24, fontWeight: "700", color: theme.colors.ink, marginBottom: 16 },
  quickActions: { flexDirection: "row", gap: 12, marginBottom: 16 },
  quickActionBtn: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.hairline,
  },
  quickActionIcon: { fontSize: 24, marginBottom: 6 },
  quickActionLabel: { fontSize: 12, fontWeight: "600", color: theme.colors.ink },
  identityCard: {
    backgroundColor: theme.colors.ink,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  identityLabel: { fontSize: 10, textTransform: "uppercase", color: "rgba(255,255,255,0.6)", marginBottom: 4 },
  identityTag: { fontSize: 24, fontWeight: "700", color: theme.colors.primaryText },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
    borderRadius: 12,
    padding: 16,
  },
  statLabel: { fontSize: 10, textTransform: "uppercase", color: theme.colors.charcoal, marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: "600", color: theme.colors.ink },
  escrowBanner: {
    backgroundColor: "rgba(234, 179, 8, 0.1)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  escrowText: { fontSize: 13, fontWeight: "500", color: theme.colors.terminalYellow },
  quickSend: { marginBottom: 24 },
  sectionTitle: { fontSize: 12, fontWeight: "500", textTransform: "uppercase", color: theme.colors.charcoal, marginBottom: 12 },
  quickSendRow: { flexDirection: "row", gap: 8 },
  tagInput: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sendButton: {
    backgroundColor: theme.colors.ink,
    borderRadius: 12,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  txnRow: {
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
});
